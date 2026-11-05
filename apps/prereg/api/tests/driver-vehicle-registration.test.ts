import { beforeAll, describe, expect, it } from 'vitest'
import { prisma } from '../src/config/prisma'
import { seedCitiesAndTransporters } from '../prisma/seed'
import partnerAccountRepository from '../src/modules/partner-account/partner-account.repository'
import { hashPassword } from '../src/helpers/password'

describe('Master Driver, Vehicle, Transporter, City & Driver Registration Request', () => {
  const runId = Date.now()
  let submitterUser: { id: number; email: string }
  let logistikUser: { id: number; email: string }

  beforeAll(async () => {
    // Ensure seeds are applied to test database
    await seedCitiesAndTransporters()

    // Create submitter (vendor partner account)
    const partner = await partnerAccountRepository.upsertPartnerMaster({
      code: `LIFNR-REG-${runId}`,
      name: 'PT Vendor Angkutan Sejahtera',
      role: 'VENDOR',
    })

    submitterUser = await partnerAccountRepository.createUserWithPartners({
      name: 'Budi Vendor',
      email: `vendor_${runId}@transport.com`,
      phone: '081299990001',
      role: 'VENDOR',
      passwordHash: hashPassword('VendorSecret123!'),
      partnerIds: [partner.id],
    })

    // Create decider (Logistik / Admin)
    logistikUser = await partnerAccountRepository.createUserWithPartners({
      name: 'Rudi Logistik',
      email: `logistik_${runId}@kpn.com`,
      phone: '081299990002',
      role: 'ADMIN',
      passwordHash: hashPassword('LogistikSecret123!'),
      partnerIds: [],
    })
  })

  describe('Master Data (City & Transporter Seeds)', () => {
    it('memiliki data kota yang valid setelah seeding', async () => {
      const karawang = await prisma.city.findUnique({ where: { name: 'Karawang' } })
      expect(karawang).toBeDefined()
      expect(karawang?.province).toBe('Jawa Barat')

      const jakarta = await prisma.city.findUnique({ where: { name: 'Jakarta' } })
      expect(jakarta).toBeDefined()
    })

    it('memiliki data transporter yang mengacu ke kota', async () => {
      const transporter = await prisma.transporter.findUnique({
        where: { code: 'TR-PNR' },
        include: { city: true },
      })
      expect(transporter).toBeDefined()
      expect(transporter?.name).toBe('PT Puninar Jaya')
      expect(transporter?.city?.name).toBe('Jakarta')
    })

    it('proses seeding bersifat idempoten (bisa dijalankan berulang tanpa error duplikasi)', async () => {
      await expect(seedCitiesAndTransporters()).resolves.not.toThrow()
    })
  })

  describe('Master Driver & Master Vehicle', () => {
    it('berhasil membuat data supir dengan semua atribut wajib dan unik nomor SIM', async () => {
      const city = await prisma.city.findFirst()
      const simNumber = `SIM-${runId}-001`

      const driver = await prisma.driver.create({
        data: {
          licenseNumber: simNumber,
          name: 'Joko Supriadi',
          address: 'Jl. Merdeka No. 45',
          birthPlace: 'Karawang',
          birthDate: new Date('1988-06-15'),
          phone: '081388887777',
          cityId: city?.id,
          licensePhotoUrl: '/uploads/sim/joko.jpg',
          driverPhotoUrl: '/uploads/driver/joko.jpg',
          isActive: true,
        },
      })

      expect(driver.id).toBeDefined()
      expect(driver.licenseNumber).toBe(simNumber)
      expect(driver.name).toBe('Joko Supriadi')

      // Verifikasi unique constraint nomor SIM
      await expect(
        prisma.driver.create({
          data: {
            licenseNumber: simNumber,
            name: 'Supir Lain',
            address: 'Alamat Lain',
            birthPlace: 'Jakarta',
            birthDate: new Date('1990-01-01'),
            phone: '081399990000',
          },
        }),
      ).rejects.toThrow()
    })

    it('berhasil membuat data kendaraan dan unik nomor polisi', async () => {
      const transporter = await prisma.transporter.findFirst()
      const plateNumber = `B ${runId.toString().slice(-4)} KPN`

      const vehicle = await prisma.vehicle.create({
        data: {
          plateNumber,
          transporterId: transporter?.id,
          stnkPhotoUrl: '/uploads/stnk/b_kpn.jpg',
          isActive: true,
        },
      })

      expect(vehicle.id).toBeDefined()
      expect(vehicle.plateNumber).toBe(plateNumber)

      // Verifikasi unique constraint nomor polisi
      await expect(
        prisma.vehicle.create({
          data: {
            plateNumber,
            transporterId: transporter?.id,
          },
        }),
      ).rejects.toThrow()
    })
  })

  describe('Pengajuan Registrasi & Jejak Keputusan (awb_driver_request & awb_driver_request_decision)', () => {
    it('alur lengkap pengajuan: diajukan -> ditolak -> disetujui -> terkirim ke pabrik', async () => {
      const city = await prisma.city.findFirst()
      const transporter = await prisma.transporter.findFirst()
      const testSim = `SIM-REQ-${runId}`
      const testPlate = `B ${(runId + 1).toString().slice(-4)} TST`

      // 1. Pengajuan diajukan (status: SUBMITTED)
      const request = await prisma.driverRequest.create({
        data: {
          status: 'SUBMITTED',
          submittedBy: submitterUser.id,
          driverLicenseNumber: testSim,
          driverName: 'Ahmad Sopian',
          driverAddress: 'Dusun Sukamaju RT 02/01',
          driverBirthPlace: 'Bekasi',
          driverBirthDate: new Date('1992-04-12'),
          driverPhone: '081234567890',
          driverCityId: city?.id,
          driverLicensePhotoUrl: '/uploads/sim/ahmad.jpg',
          driverPhotoUrl: '/uploads/driver/ahmad.jpg',
          vehiclePlateNumber: testPlate,
          transporterId: transporter?.id,
          vehicleStnkPhotoUrl: '/uploads/stnk/ahmad_truck.jpg',
        },
      })

      expect(request.id).toBeDefined()
      expect(request.status).toBe('SUBMITTED')
      expect(request.decidedBy).toBeNull()

      // 2. Ditolak oleh Logistik dengan alasan penolakan
      const rejectDecision = await prisma.driverRequestDecision.create({
        data: {
          requestId: request.id,
          decision: 'REJECTED',
          rejectionReason: 'Foto SIM buram dan masa berlaku tidak terbaca',
          decidedBy: logistikUser.id,
          decidedAt: new Date(),
        },
      })

      const rejectedRequest = await prisma.driverRequest.update({
        where: { id: request.id },
        data: {
          status: 'REJECTED',
          decision: 'REJECTED',
          decidedBy: logistikUser.id,
          decidedAt: rejectDecision.decidedAt,
          rejectionReason: rejectDecision.rejectionReason,
        },
      })

      expect(rejectedRequest.status).toBe('REJECTED')
      expect(rejectedRequest.rejectionReason).toBe('Foto SIM buram dan masa berlaku tidak terbaca')
      expect(rejectedRequest.decidedBy).toBe(logistikUser.id)

      // 3. Revisi foto dan disetujui oleh Logistik
      const approveDecision = await prisma.driverRequestDecision.create({
        data: {
          requestId: request.id,
          decision: 'APPROVED',
          decidedBy: logistikUser.id,
          decidedAt: new Date(),
        },
      })

      // Ketika disetujui, simpan juga master driver & master vehicle
      const approvedDriver = await prisma.driver.create({
        data: {
          licenseNumber: testSim,
          name: request.driverName,
          address: request.driverAddress,
          birthPlace: request.driverBirthPlace,
          birthDate: request.driverBirthDate,
          phone: request.driverPhone,
          cityId: request.driverCityId,
          licensePhotoUrl: '/uploads/sim/ahmad_revisi.jpg',
          driverPhotoUrl: request.driverPhotoUrl,
        },
      })

      const approvedVehicle = await prisma.vehicle.create({
        data: {
          plateNumber: testPlate,
          transporterId: request.transporterId,
          stnkPhotoUrl: request.vehicleStnkPhotoUrl,
        },
      })

      const approvedRequest = await prisma.driverRequest.update({
        where: { id: request.id },
        data: {
          status: 'APPROVED',
          decision: 'APPROVED',
          rejectionReason: null,
          decidedBy: logistikUser.id,
          decidedAt: approveDecision.decidedAt,
          driverId: approvedDriver.id,
          vehicleId: approvedVehicle.id,
          driverLicensePhotoUrl: '/uploads/sim/ahmad_revisi.jpg',
        },
        include: {
          decisions: true,
          driver: true,
          vehicle: true,
          submitter: true,
          decider: true,
        },
      })

      expect(approvedRequest.status).toBe('APPROVED')
      expect(approvedRequest.driverId).toBe(approvedDriver.id)
      expect(approvedRequest.vehicleId).toBe(approvedVehicle.id)
      expect(approvedRequest.decisions.length).toBe(2)
      expect(approvedRequest.decisions[0]!.decision).toBe('REJECTED')
      expect(approvedRequest.decisions[1]!.decision).toBe('APPROVED')

      // 4. Terkirim ke pabrik
      const sentRequest = await prisma.driverRequest.update({
        where: { id: request.id },
        data: {
          status: 'SENT_TO_PLANT',
          sentToPlantAt: new Date(),
        },
      })

      expect(sentRequest.status).toBe('SENT_TO_PLANT')
      expect(sentRequest.sentToPlantAt).toBeDefined()
    })
  })
})
