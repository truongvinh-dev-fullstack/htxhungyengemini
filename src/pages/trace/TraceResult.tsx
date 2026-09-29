import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/Header';
import { HTX_LIST } from '../../mock/data';

interface JourneyStep {
  time: string;
  title: string;
  desc: string;
}

export const TraceResult: React.FC = () => {
  const { screenParams, navigateTo, packages, harvests, farmZones, diaries, members, processingLots, orders } = useApp();
  const rawCode = (screenParams?.code || '').trim();

  // Helper ẩn số điện thoại bảo mật thông tin cá nhân (chỉ hiện 0988***333)
  const maskPhone = (phone?: string) => {
    if (!phone) return '';
    const clean = phone.replace(/\s+/g, '');
    if (clean.length < 7) return '***';
    return `${clean.slice(0, 4)}***${clean.slice(-3)}`;
  };

  // Helper lấy tên hộ thành viên
  const getFarmerName = (zone: any, fallback: string) => {
    if (!zone) return fallback;
    if (zone.ownerName) return zone.ownerName;
    const m = members.find((mem) => mem.id === zone.ownerId);
    return m ? m.name : fallback;
  };

  // Validate and match code
  const matchResult = useMemo(() => {
    if (!rawCode) return null;

    // 1. Tìm trong packages thực tế
    const pkg = packages.find(
      (p) =>
        p.code.toLowerCase() === rawCode.toLowerCase() ||
        (p.qrCodeUrl && p.qrCodeUrl.toLowerCase().includes(rawCode.toLowerCase())) ||
        rawCode.toLowerCase().includes(p.code.toLowerCase())
    );

    // 2. Tìm trong Lô thu hoạch bán sống / hàng xá (Không qua đóng gói)
    const matchedHarvest = harvests.find(
      (h) =>
        h.code.toLowerCase() === rawCode.toLowerCase() ||
        (h.qrCodeUrl && h.qrCodeUrl.toLowerCase().includes(rawCode.toLowerCase())) ||
        rawCode.toLowerCase().includes(h.code.toLowerCase())
    );

    // 3. Tìm trong Đơn bán hàng / Phiếu xuất (Bán sống hoặc xuất kho)
    const matchedOrder = orders?.find(
      (o) =>
        o.code.toLowerCase() === rawCode.toLowerCase() ||
        (o.qrCodeUrl && o.qrCodeUrl.toLowerCase().includes(rawCode.toLowerCase())) ||
        rawCode.toLowerCase().includes(o.code.toLowerCase())
    );

    // 4. Tìm theo alias demo
    const isRiceBT7 = rawCode.includes('AN-BT7') || rawCode.includes('BT7-089');
    const isRiceST25 = rawCode.includes('AN-ST25') || rawCode.includes('ST25-045');
    const isGa = rawCode.includes('DT-GA') || rawCode.includes('GA-012');
    const isNhan = rawCode.includes('QT-NHAN') || rawCode.includes('NHAN-005');

    if (!pkg && !matchedHarvest && !matchedOrder && !isRiceBT7 && !isRiceST25 && !isGa && !isNhan) {
      return null;
    }

    // A. Xử lý quét mã Lô thu hoạch bán sống / Hàng xá (Không qua đóng gói)
    if (!pkg && matchedHarvest) {
      const zone = farmZones.find((z) => z.id === matchedHarvest.farmZoneId);
      const htx = HTX_LIST[matchedHarvest.htxId] || HTX_LIST.dongtao;
      const publicDiaries = zone
        ? diaries.filter((d) => d.farmZoneId === zone.id && !d.notes?.toLowerCase().includes('nội bộ'))
        : [];

      const harvestSources = (matchedHarvest.sources && matchedHarvest.sources.length > 0)
        ? matchedHarvest.sources
        : [{
            farmZoneId: matchedHarvest.farmZoneId,
            farmZoneName: matchedHarvest.farmZoneName || zone?.name || 'Cơ sở sản xuất',
            zoneCode: zone?.zoneCode,
            quantity: matchedHarvest.yieldQuantity,
            unit: matchedHarvest.unit,
            harvestDate: matchedHarvest.date,
          }];

      const journey: JourneyStep[] = [];

      if (harvestSources.length > 1) {
        journey.push({
          time: matchedHarvest.seasonName || zone?.season || 'Vụ Canh tác 2026',
          title: `1. Thu hoạch từ ${harvestSources.length} thửa ruộng / vùng nuôi`,
          desc: `Các thửa đóng góp: ${harvestSources.map((s) => `${s.farmZoneName}${s.zoneCode ? ` (${s.zoneCode})` : ''}: ${s.quantity?.toLocaleString()} ${s.unit}${s.cycleName ? ` [${s.cycleName}]` : ''}`).join('; ')}. Hộ phụ trách: ${getFarmerName(zone, matchedHarvest.ownerName || 'Hộ thành viên HTX')}. Tiêu chuẩn: VietGAP.`,
        });
      } else {
        journey.push({
          time: matchedHarvest.seasonName || zone?.season || 'Vụ Canh tác 2026',
          title: `1. Cơ sở nuôi trồng / Vùng canh tác: ${zone?.name || matchedHarvest.farmZoneName || 'Cơ sở sản xuất'}`,
          desc: `${zone?.zoneCode ? `Mã số cơ sở: ${zone.zoneCode}. ` : ''}Hộ phụ trách: ${getFarmerName(zone, matchedHarvest.ownerName || 'Hộ thành viên HTX')}. Tiêu chuẩn: VietGAP.`,
        });
      }

      if (publicDiaries.length > 0) {
        publicDiaries.slice(0, 2).forEach((d) => {
          journey.push({
            time: d.date,
            title: `Quy trình chăm sóc: ${d.workTypeName}`,
            desc: `${d.suppliesUsed ? `Vật tư sử dụng: ${d.suppliesUsed}. ` : ''}Ghi chú: ${d.notes || 'Thực hiện chuẩn VietGAP.'}`,
          });
        });
      }

      journey.push({
        time: matchedHarvest.date || 'Thu hoạch',
        title: `2. Thu hoạch / Xuất đàn: Lô ${matchedHarvest.code}`,
        desc: `Tổng sản lượng: ${matchedHarvest.yieldQuantity?.toLocaleString() || ''} ${matchedHarvest.unit}${matchedHarvest.grade1Quantity !== undefined ? ` (Loại 1: ${matchedHarvest.grade1Quantity.toLocaleString()} ${matchedHarvest.unit})` : ''}. Chỉ số chất lượng: ${matchedHarvest.qualityMetric || 'Đạt chuẩn'}.${harvestSources.length > 1 ? ` (Gồm ${harvestSources.length} thửa nguồn: ${harvestSources.map((s) => `${s.farmZoneName} ${s.quantity} ${s.unit}`).join(', ')})` : ''}`,
      });

      journey.push({
        time: matchedHarvest.date,
        title: `3. Lưu thông: Bán nông sản tươi sống / Hàng xá nguyên trạng`,
        desc: `Sản phẩm bán sống nguyên trạng (gà sống/cá sống/thùng xá), truy xuất trực tiếp từ mã lô ${matchedHarvest.code} theo quy định HTX. Không qua công đoạn đóng gói lẻ.`,
      });

      return {
        code: matchedHarvest.code,
        name: `${matchedHarvest.variety || 'Nông sản đặc sản'} (Bán sống/Hàng xá)`,
        htx: htx.name,
        location: htx.address,
        farmer: `${getFarmerName(zone, matchedHarvest.ownerName || 'Hộ thành viên HTX')} (Hộ thành viên HTX)`,
        farmerPhoneMasked: maskPhone(matchedHarvest.ownerPhone),
        zone: harvestSources.length > 1
          ? harvestSources.map((s) => `${s.farmZoneName} (${s.quantity} ${s.unit})`).join(', ')
          : `${zone?.name || matchedHarvest.farmZoneName || 'Cơ sở sản xuất'} ${zone?.zoneCode ? `(${zone.zoneCode})` : ''}`,
        season: matchedHarvest.seasonName || zone?.season || 'Vụ Canh tác',
        lotCode: matchedHarvest.code,
        lotSources: harvestSources.length > 1 ? harvestSources : undefined,
        processingSummary: 'Bán nông sản tươi sống / Hàng xá nguyên trạng (Không đóng gói)',
        standard: 'VietGAP • Chuỗi nông sản an toàn Hưng Yên',
        certValidUntil: '2026-12-31',
        isCertActive: true,
        isLiveProduct: true,
        photo: matchedHarvest.photoUrl || 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=600&auto=format&fit=crop&q=80',
        harvestDate: matchedHarvest.date,
        packDate: 'Bán tươi sống nguyên trạng',
        expiryDate: 'Nông sản tươi sống giao nhận ngay',
        journey,
      };
    }

    // B. Xử lý quét mã Phiếu xuất / Đơn bán hàng
    if (!pkg && matchedOrder) {
      const harvest = harvests.find((h) => h.id === matchedOrder.harvestLotId || h.code === matchedOrder.harvestLotCode);
      const zone = farmZones.find((z) => z.id === harvest?.farmZoneId);
      const htx = HTX_LIST[matchedOrder.htxId] || HTX_LIST.dongtao;
      const orderSources = harvest?.sources && harvest.sources.length > 1 ? harvest.sources : undefined;

      const journey: JourneyStep[] = [
        {
          time: harvest?.seasonName || zone?.season || 'Vụ Canh tác 2026',
          title: orderSources
            ? `1. Nguồn gốc từ ${orderSources.length} thửa ruộng / vùng nuôi: ${zone?.name || 'Cơ sở nuôi trồng HTX'}`
            : `1. Nguồn gốc cơ sở sản xuất: ${zone?.name || 'Cơ sở nuôi trồng HTX'}`,
          desc: `${orderSources ? `Các thửa: ${orderSources.map((s) => `${s.farmZoneName} (${s.quantity} ${s.unit})`).join('; ')}. ` : ''}Hộ sản xuất: ${getFarmerName(zone, harvest?.ownerName || matchedOrder.sellerName || 'Hộ thành viên HTX')}. Lô nguồn: ${harvest?.code || matchedOrder.harvestLotCode || 'Lô gốc'}.`,
        },
        {
          time: harvest?.date || matchedOrder.date,
          title: `2. Thu hoạch & Kiểm tra nguồn hàng`,
          desc: `Sản phẩm ${matchedOrder.productName}, lô nguồn ${harvest?.code || matchedOrder.harvestLotCode || 'Lô gốc'}. Đạt chuẩn xuất bán HTX.`,
        },
        {
          time: matchedOrder.date,
          title: `3. Lập phiếu xuất bán & Giao nhận: ${matchedOrder.code}`,
          desc: `Khối lượng xuất: ${matchedOrder.quantity?.toLocaleString()} ${matchedOrder.unit}. Khách hàng: ${matchedOrder.customerName}. Kênh phân phối: ${matchedOrder.salesChannel || 'Đại lý phân phối'}. Trạng thái giao hàng: ${matchedOrder.deliveryStatus === 'da_giao' ? 'Đã giao thành công' : 'Đang vận chuyển'}.`,
        },
      ];

      return {
        code: matchedOrder.code,
        name: `${matchedOrder.productName} (Phiếu xuất ${matchedOrder.code})`,
        htx: htx.name,
        location: htx.address,
        farmer: `${getFarmerName(zone, harvest?.ownerName || matchedOrder.sellerName || 'Hộ thành viên')} (Hộ thành viên HTX)`,
        farmerPhoneMasked: maskPhone(harvest?.ownerPhone),
        zone: `${zone?.name || harvest?.farmZoneName || 'Cơ sở sản xuất'}`,
        season: harvest?.seasonName || zone?.season || 'Vụ Canh tác',
        lotCode: harvest?.code || matchedOrder.harvestLotCode || 'Lô nguồn',
        lotSources: orderSources,
        processingSummary: 'Xuất bán theo Phiếu xuất HTX (Hàng xá / Bán sống)',
        standard: 'VietGAP • Tiêu chuẩn phân phối HTX',
        certValidUntil: '2026-12-31',
        isCertActive: true,
        isLiveProduct: true,
        photo: harvest?.photoUrl || 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=600&auto=format&fit=crop&q=80',
        harvestDate: harvest?.date || matchedOrder.date,
        packDate: `Phiếu xuất ${matchedOrder.date}`,
        expiryDate: 'Theo chứng từ giao hàng',
        journey,
      };
    }

    if (pkg) {
      const harvest = harvests.find((h) => h.id === pkg.harvestLotId || h.code === pkg.harvestLotCode);
      const zone = farmZones.find((z) => z.id === harvest?.farmZoneId);
      const htx = HTX_LIST[pkg.htxId] || HTX_LIST.anninh;
      const lotSources = pkg.harvestSnapshot?.sources || harvest?.sources;

      // Xử lý gom lô nếu có nhiều nguồn đầu vào
      const sourceBatches = pkg.sourceBatches && pkg.sourceBatches.length > 0
        ? pkg.sourceBatches
        : [
            {
              harvestLotId: harvest?.id || 'th-01',
              harvestLotCode: harvest?.code || pkg.harvestLotCode || 'TH-HTX',
              ownerName: harvest?.ownerName || 'Hộ thành viên HTX',
              quantity: pkg.packQuantity * (pkg.netWeightPerPack || 1),
              unit: pkg.netWeightUnit || harvest?.unit || 'kg',
            },
          ];

      const isMultiSource = sourceBatches.length > 1;

      // Thông tin sơ chế từ snapshot hoặc liên kết
      const procSnapshot = pkg.processingSnapshot;
      const procLot = processingLots.find((p) => p.id === pkg.processingLotId || p.harvestLotId === harvest?.id);
      const hasProc = procSnapshot?.hasProcessing ?? (!!pkg.processingLotId || !!procLot || harvest?.processingStatus === 'da_so_che');

      const procMethod = procSnapshot?.method || procLot?.method || harvest?.processingInfo?.method || 'Xay xát, làm sạch phân loại';
      const procOut = procSnapshot?.outputQuantity || procLot?.outputQuantity || harvest?.processingInfo?.outputQuantity;
      const procLoss = procSnapshot?.lossRatePercent || procLot?.lossRatePercent || harvest?.processingInfo?.lossRatePercent;

      // Chỉ lấy nhật ký công khai đã khóa >24h
      const publicDiaries = zone
        ? diaries.filter((d) => d.farmZoneId === zone.id && !d.notes?.toLowerCase().includes('nội bộ'))
        : [];

      // Kiểm tra hiệu lực chứng nhận
      const isCertActive = !pkg.certValidUntil || new Date(pkg.certValidUntil).getTime() >= new Date().getTime();

      const journey: JourneyStep[] = [];

      // Bước 1: Vùng canh tác / Cơ sở sản xuất
      if (isMultiSource) {
        journey.push({
          time: harvest?.seasonName || zone?.season || 'Vụ Canh tác 2026',
          title: `1. Gom nông sản từ ${sourceBatches.length} hộ thành viên HTX`,
          desc: `Mẻ đóng gói được HTX gom từ các lô: ${sourceBatches.map((s) => `${s.harvestLotCode} (${s.ownerName || 'Hộ dân'}, ${s.quantity} ${s.unit})`).join('; ')}.`,
        });
      } else {
        journey.push({
          time: harvest?.seasonName || zone?.season || 'Vụ Canh tác',
          title: `1. Cơ sở sản xuất & Mùa vụ: ${zone?.name || 'Cơ sở sản xuất HTX'}`,
          desc: `${zone?.zoneCode ? `Mã số cơ sở: ${zone.zoneCode}. ` : ''}Hộ thành viên: ${getFarmerName(zone, harvest?.ownerName || 'Hộ thành viên HTX')}. Giống: ${harvest?.variety || zone?.variety || 'Nông sản VietGAP'}.`,
        });
      }

      // Bước 2: Nhật ký công khai
      if (publicDiaries.length > 0) {
        publicDiaries.slice(0, 2).forEach((d) => {
          journey.push({
            time: d.date,
            title: `Quy trình canh tác: ${d.workTypeName}`,
            desc: `${d.suppliesUsed ? `Vật tư sử dụng: ${d.suppliesUsed}. ` : ''}Ghi chú hiện trường: ${d.notes || 'Thực hiện chuẩn VietGAP.'}`,
          });
        });
      }

      // Bước 3: Thu hoạch
      journey.push({
        time: harvest?.date || 'Thu hoạch',
        title: `2. Thu hoạch - Lô: ${harvest?.code || pkg.harvestLotCode || 'TH-HTX'}`,
        desc: `Sản lượng lô ${harvest?.yieldQuantity?.toLocaleString() || ''} ${harvest?.unit || 'kg'}${
          harvest?.grade1Quantity !== undefined
            ? ` (Loại 1: ${harvest.grade1Quantity.toLocaleString()} ${harvest.unit})`
            : ''
        }.${harvest?.qualityMetric ? ` Chỉ số chất lượng: ${harvest.qualityMetric}.` : ''}${
          lotSources && lotSources.length > 1
            ? ` Nguồn gồm ${lotSources.length} thửa ruộng: ${lotSources.map((s) => `${s.farmZoneName} (${s.quantity} ${s.unit})`).join(', ')}.`
            : ''
        }`,
      });

      // Bước 4: Sơ chế
      if (hasProc) {
        journey.push({
          time: procSnapshot?.date || procLot?.date || harvest?.processingInfo?.date || harvest?.date || 'Sơ chế',
          title: `3. Sơ chế: ${procMethod}`,
          desc: `Ra thành phẩm: ${procOut?.toLocaleString() || ''} ${harvest?.unit || 'kg'}${procLoss !== undefined ? ` (Hao hụt sơ chế: ${procLoss}%)` : ''}. Đảm bảo ATTP.`,
        });
      } else {
        journey.push({
          time: harvest?.date || 'Không sơ chế',
          title: `3. Giữ nguyên trạng tươi sống / Không sơ chế nhiệt`,
          desc: `Nông sản tươi đạt chất lượng cao được đưa thẳng vào bao gói hoặc tiêu thụ sống theo tiêu chuẩn.`,
        });
      }

      // Bước 5: Đóng gói
      const originText = pkg.sourceProductState === 'hang_tho'
        ? 'Từ hàng thô · Chưa sơ chế'
        : pkg.sourceProductState === 'da_xu_ly'
        ? 'Từ hàng đã sơ chế'
        : (pkg.isLiveProduct || (!hasProc && !pkg.processingLotId))
        ? 'Từ hàng thô'
        : 'Nguồn đóng gói chưa xác định';

      journey.push({
        time: pkg.createdDate,
        title: `4. Phát hành tem QR: ${pkg.productName}`,
        desc: `Nguồn đầu vào: ${originText}${pkg.sourceStockItemId ? ` (Dòng nguồn: ${pkg.sourceStockItemId})` : ''}. Quy cách: ${pkg.packagingSpec || `${pkg.packQuantity} ${pkg.unit}`}. Tiêu chuẩn: ${pkg.standard}${pkg.certValidUntil ? ` (Hiệu lực: ${pkg.certValidUntil})` : ''}. Tem mã: ${pkg.code}.`,
      });

      return {
        code: pkg.code,
        name: pkg.productName,
        htx: htx.name,
        location: htx.address,
        farmer: isMultiSource
          ? `Gom từ ${sourceBatches.length} hộ thành viên HTX`
          : `${getFarmerName(zone, harvest?.ownerName || 'Hộ thành viên')} (Hộ thành viên HTX)`,
        farmerPhoneMasked: maskPhone(harvest?.ownerPhone),
        zone: `${zone?.name || harvest?.farmZoneName || 'Cơ sở sản xuất'} ${zone?.zoneCode ? `(${zone.zoneCode})` : ''}`,
        season: harvest?.seasonName || zone?.season || 'Vụ Canh tác',
        lotCode: pkg.harvestLotCode || harvest?.code || 'TH-HTX-2026',
        sourceBatches: isMultiSource ? sourceBatches : undefined,
        lotSources: lotSources && lotSources.length > 1 ? lotSources : undefined,
        processingSummary: hasProc ? `${procMethod} (Hao hụt: ${procLoss || 0}%)` : 'Không sơ chế (Nông sản tươi sống)',
        standard: pkg.standard,
        certValidUntil: pkg.certValidUntil,
        isCertActive,
        isLiveProduct: pkg.isLiveProduct,
        photo: harvest?.photoUrl || 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=600&auto=format&fit=crop&q=80',
        harvestDate: harvest?.date || 'Đang cập nhật',
        packDate: pkg.createdDate,
        expiryDate: pkg.isLiveProduct ? 'Hàng tươi sống giao nhận ngay' : (pkg.expiryDate || 'Theo quy cách bao bì'),
        journey,
      };
    }

    // Static fallback demo (nhãn, gà, lúa)
    if (isGa) {
      const harvest = harvests.find((h) => h.htxId === 'dongtao');
      const zone = farmZones.find((z) => z.id === harvest?.farmZoneId || z.id === 'fz-03');
      const htx = HTX_LIST.dongtao;
      return {
        code: rawCode || 'TXNG-HY-DT-GA-012',
        name: 'Gà đặc sản Đông Tảo thuần chủng chân to tiến vua',
        htx: htx.name,
        location: htx.address,
        farmer: `${getFarmerName(zone, 'Bác Trần Đình Trọng')} (Hộ thành viên HTX)`,
        farmerPhoneMasked: '0988***234',
        zone: zone?.name || 'Khu chuồng nuôi thả vườn Vườn Nhãn (Đàn 450 con)',
        season: harvest?.seasonName || 'Lứa gà thịt Tết 2026',
        lotCode: harvest?.code || 'TH-DT-2026-001',
        processingSummary: 'Kiểm dịch thú y & Bán sống gắn vòng chân QR',
        standard: 'OCOP 4 sao • Chuỗi nông sản an toàn Hưng Yên',
        certValidUntil: '2026-12-31',
        isCertActive: true,
        isLiveProduct: true,
        photo: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=600&auto=format&fit=crop&q=80',
        harvestDate: harvest?.date || '10/09/2026',
        packDate: '10/09/2026',
        expiryDate: 'Hàng sống giao nhận ngay (Vòng chân QR)',
        journey: [
          { time: '02/2026', title: '1. Vùng nuôi & Con giống', desc: 'Gà Đông Tảo thuần chủng đời F1 chân vảy rồng tại Khu chuồng Vườn Nhãn.' },
          { time: '05/2026', title: 'Chăm sóc sinh học', desc: 'Thức ăn ngô mảnh ủ men vi sinh, uống nước thảo dược tự nhiên.' },
          { time: '10/09/2026', title: '2. Xuất chuồng & Gắn tem vòng chân', desc: 'Xuất chuồng tuyển chọn, trọng lượng TB 4.2 kg/con, gắn vòng chân truy xuất QR.' },
        ] as JourneyStep[],
      };
    }

    if (isNhan) {
      const harvest = harvests.find((h) => h.htxId === 'quyetthang');
      const zone = farmZones.find((z) => z.id === harvest?.farmZoneId || z.id === 'fz-04');
      const htx = HTX_LIST.quyetthang;
      return {
        code: rawCode || 'TXNG-HY-QT-NHAN-005',
        name: 'Nhãn lồng tiến vua Hương Chi Hưng Yên (Thùng 10kg)',
        htx: htx.name,
        location: htx.address,
        farmer: `${getFarmerName(zone, 'Bác Phạm Thị Mai')} (Hộ thành viên tiêu biểu)`,
        farmerPhoneMasked: '0978***567',
        zone: zone?.name || 'Vườn Nhãn Hương Chi - Khu A (1,2 hecta)',
        season: harvest?.seasonName || 'Vụ Nhãn 2026',
        lotCode: harvest?.code || 'TH-QT-2026-001',
        processingSummary: 'Sấy dẻo nhiệt độ thấp (Long nhãn tiến vua)',
        standard: 'VietGAP • Chỉ dẫn địa lý Nhãn lồng Hưng Yên',
        certValidUntil: '2026-11-30',
        isCertActive: true,
        isLiveProduct: false,
        photo: 'https://images.unsplash.com/photo-1618897996318-5a901fa6ca71?w=600&auto=format&fit=crop&q=80',
        harvestDate: harvest?.date || '07/09/2026',
        packDate: '10/09/2026',
        expiryDate: '10/03/2027',
        journey: [
          { time: '01/2026', title: '1. Vùng trồng & Mùa vụ', desc: 'Vườn Nhãn Hương Chi Khu A đạt chứng nhận VietGAP số VG-HY-2026.' },
          { time: '07/09/2026', title: '2. Thu hoạch chọn lọc', desc: 'Hái tay từng chùm quả to đều, cùi dày ráo nước, độ ngọt 19° Brix.' },
          { time: '08/09/2026', title: '3. Sơ chế sấy dẻo', desc: 'Sấy dẻo nhiệt độ thấp tách vỏ hạt, giữ nguyên hương vị tự nhiên.' },
          { time: '10/09/2026', title: '4. Đóng thùng dán tem QR', desc: 'Đóng thùng carton 10kg có tem QR chống hàng giả của HTX Quyết Thắng.' },
        ] as JourneyStep[],
      };
    }

    const harvest = harvests.find((h) => h.farmZoneId === 'fz-01');
    const zone = farmZones.find((z) => z.id === 'fz-01');
    const htx = HTX_LIST.anninh;

    return {
      code: rawCode || 'TXNG-HY-AN-BT7-089',
      name: 'Gạo sạch Bắc Thơm số 7 Hưng Yên (Túi 5kg)',
      htx: htx.name,
      location: htx.address,
      farmer: `${getFarmerName(zone, 'Bác Nguyễn Văn An')} (Hộ thành viên HTX)`,
      farmerPhoneMasked: '0912***888',
      zone: zone?.name || 'Thửa Đầm Bông - Cánh đồng Lớn (3.500 m²)',
      season: harvest?.seasonName || 'Vụ Xuân 2026',
      lotCode: harvest?.code || 'TH-AN-2026-001',
      processingSummary: 'Xay xát bóc vỏ trấu & sàng lọc đánh bóng',
      standard: 'VietGAP • OCOP 4 sao • Không hóa chất cấm',
      certValidUntil: '2026-10-31',
      isCertActive: true,
      isLiveProduct: false,
      photo: 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=600&auto=format&fit=crop&q=80',
      harvestDate: harvest?.date || '15/05/2026',
      packDate: '17/09/2026',
      expiryDate: '17/03/2027',
      journey: [
        { time: '01/2026', title: '1. Vùng canh tác & Mùa vụ', desc: 'Thửa Đầm Bông (MSVT-AN-01), Vụ Xuân 2026, giống Bắc Thơm 7.' },
        { time: '15/05/2026', title: '2. Thu hoạch máy gặt', desc: 'Thu hoạch lúa tươi chất lượng Loại 1: 1.000 kg, Loại 2: 200 kg.' },
        { time: '16/09/2026', title: '3. Xay xát sơ chế', desc: 'Tách trấu bóc vỏ đạt 816 kg gạo thành phẩm (hao hụt 32%).' },
        { time: '17/09/2026', title: '4. Đóng gói dán tem QR', desc: 'Đóng túi 5kg dán tem QR truy xuất điện tử HTX An Ninh.' },
      ] as JourneyStep[],
    };
  }, [rawCode, packages, harvests, farmZones, diaries, members, processingLots]);

  // CASE 1: MÃ QR KHÔNG HỢP LỆ
  if (!matchResult) {
    return (
      <div className="pb-24 bg-slate-50 min-h-screen">
        <Header
          title="Kết quả truy xuất"
          voiceText="Cảnh báo, mã QR này không tồn tại trên hệ thống dữ liệu Hợp tác xã Hưng Yên."
        />

        <div className="p-4 space-y-4">
          <div className="bg-red-600 text-white rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-white text-red-600 flex items-center justify-center text-3xl font-black flex-shrink-0">
                ⚠️
              </div>
              <div>
                <span className="text-xs uppercase font-extrabold tracking-wider text-red-200">
                  CẢNH BÁO AN TOÀN NÔNG SẢN
                </span>
                <h3 className="text-xl font-black leading-tight mt-0.5">
                  MÃ QR KHÔNG TỒN TẠI
                </h3>
              </div>
            </div>

            <div className="p-4 bg-red-700/80 rounded-2xl border border-red-500 font-mono text-sm break-all">
              <span className="text-red-200 block text-xs font-sans font-bold">Mã đã quét:</span>
              <span className="text-white font-black">{rawCode || '(Mã trống)'}</span>
            </div>

            <p className="text-xs text-red-100 leading-relaxed">
              Hệ thống cơ sở dữ liệu số Hợp tác xã tỉnh Hưng Yên không tìm thấy bản ghi nào tương ứng với mã số tem này.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-5 border-2 border-slate-200 shadow-sm space-y-3">
            <h4 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <span>🔍</span>
              <span>Nguyên nhân có thể do:</span>
            </h4>
            <ul className="text-xs text-slate-600 space-y-2 list-disc pl-5">
              <li>Mã tem QR bị in sai hoặc không thuộc các HTX trong tỉnh Hưng Yên.</li>
              <li>Tem chống giả chưa được kích hoạt chính thức từ kho xuất bán của HTX.</li>
              <li>Sản phẩm có nguy cơ là hàng nhái, hàng mạo danh thương hiệu nông sản Hưng Yên.</li>
            </ul>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <button
              onClick={() => navigateTo('trace_scan')}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-2xl font-extrabold text-base shadow flex items-center justify-center gap-2"
            >
              <span>📷</span>
              <span>QUAY LẠI QUÉT MÃ KHÁC</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // CASE 2: MÃ QR HỢP LỆ
  return (
    <div className="pb-24 bg-slate-50 min-h-screen">
      <Header
        title="Thông tin nguồn gốc"
        voiceText={`Sản phẩm ${matchResult.name}, sản xuất bởi ${matchResult.htx}. Đạt tiêu chuẩn ${matchResult.standard}.`}
      />

      <div className="p-4 space-y-4">
        {/* Verification Success Ribbon */}
        <div className="bg-emerald-600 text-white rounded-3xl p-4 shadow-md flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white text-emerald-700 flex items-center justify-center text-3xl font-bold flex-shrink-0">
            ✓
          </div>
          <div>
            <div className="text-xs uppercase font-extrabold tracking-wider text-emerald-200">
              XÁC THỰC CHÍNH HÃNG HƯNG YÊN
            </div>
            <h3 className="text-lg font-extrabold leading-tight">Mã QR hợp lệ toàn chuỗi</h3>
            <p className="text-xs text-emerald-100 font-mono mt-0.5">{matchResult.code}</p>
          </div>
        </div>

        {/* Product Identity Card */}
        <div className="bg-white rounded-3xl overflow-hidden border-2 border-slate-200 shadow-sm">
          <div className="aspect-video relative bg-slate-100">
            <img
              src={matchResult.photo}
              alt={matchResult.name}
              className="w-full h-full object-cover"
            />
            {matchResult.isCertActive && (
              <div className="absolute bottom-3 left-3 bg-emerald-800/80 backdrop-blur text-white text-xs px-3 py-1 rounded-full font-bold">
                ✓ {matchResult.standard} (Hiệu lực: {matchResult.certValidUntil || 'Còn hạn'})
              </div>
            )}
          </div>

          <div className="p-5 space-y-3">
            <h2 className="text-2xl font-extrabold text-slate-900 leading-tight">
              {matchResult.name}
            </h2>

            <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-1.5 text-sm text-emerald-950">
              <div>• <strong>Hợp tác xã:</strong> {matchResult.htx}</div>
              <div>• <strong>Địa chỉ HTX:</strong> {matchResult.location}</div>
              <div>• <strong>Bên sản xuất:</strong> {matchResult.farmer}</div>
              {matchResult.farmerPhoneMasked && (
                <div>• <strong>Hotline bảo hành:</strong> <span className="font-mono">{matchResult.farmerPhoneMasked}</span></div>
              )}
              <div>• <strong>Cơ sở sản xuất:</strong> {matchResult.zone}</div>
              <div>• <strong>Chu kỳ / Mùa vụ:</strong> <span className="font-bold text-emerald-800">{matchResult.season}</span></div>
              <div>• <strong>Mã lô thu hoạch:</strong> <span className="font-mono font-bold">{matchResult.lotCode}</span></div>
              <div>• <strong>Chế biến / Sơ chế:</strong> <span className="font-semibold text-blue-900">{matchResult.processingSummary}</span></div>
            </div>

            {/* Thông tin gom lô nếu có */}
            {matchResult.sourceBatches && matchResult.sourceBatches.length > 1 && (
              <div className="p-3 bg-purple-50 rounded-2xl border border-purple-200 text-xs space-y-1">
                <span className="font-extrabold text-purple-950 block">
                  📦 Mẻ đóng gói gom nông sản từ {matchResult.sourceBatches.length} hộ thành viên:
                </span>
                <ul className="list-disc pl-4 space-y-0.5 text-purple-900">
                  {matchResult.sourceBatches.map((b, i) => (
                    <li key={i}>
                      Lô <strong>{b.harvestLotCode}</strong> - {b.ownerName}: <strong>{b.quantity} {b.unit}</strong>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Thông tin các thửa / vùng nguồn của lô nếu có */}
            {matchResult.lotSources && matchResult.lotSources.length > 1 && (
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-300 text-xs space-y-1">
                <span className="font-extrabold text-emerald-950 block">
                  🌾 Lô thu hoạch gồm {matchResult.lotSources.length} thửa / vùng nguồn:
                </span>
                <ul className="list-disc pl-4 space-y-0.5 text-emerald-900">
                  {matchResult.lotSources.map((s: any, i: number) => (
                    <li key={i}>
                      Thửa <strong>{s.farmZoneName}</strong>{s.zoneCode ? ` (${s.zoneCode})` : ''}: <strong>{s.quantity?.toLocaleString()} {s.unit}</strong>
                      {s.cycleName ? ` • Vụ/Lứa: ${s.cycleName}` : ''}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500 font-bold block">Ngày thu hoạch:</span>
                <span className="text-sm font-extrabold text-slate-800">{matchResult.harvestDate}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500 font-bold block">Hạn dùng khuyến nghị:</span>
                <span className="text-sm font-extrabold text-slate-800">{matchResult.expiryDate}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Hành trình chuỗi giá trị minh bạch */}
        <div className="bg-white rounded-3xl p-5 border-2 border-slate-200 shadow-sm space-y-4">
          <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <span>🌱</span> Hành trình Vùng → Mùa vụ → Thu hoạch → Sơ chế → Đóng gói
          </h3>

          <div className="relative pl-6 space-y-5 border-l-4 border-emerald-500 ml-3 py-1">
            {matchResult.journey.map((item, index) => (
              <div key={index} className="relative">
                <div className="absolute -left-[31px] top-0.5 w-6 h-6 rounded-full bg-emerald-600 border-4 border-white shadow-sm flex items-center justify-center text-[10px] text-white font-bold">
                  {index + 1}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                      {item.time}
                    </span>
                    <h4 className="text-base font-extrabold text-slate-900">{item.title}</h4>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Back and Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => navigateTo('trace_scan')}
            className="flex-1 py-4 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-2xl font-extrabold text-base"
          >
            Quét mã khác
          </button>
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: matchResult.name,
                  text: `Truy xuất nguồn gốc ${matchResult.name} - ${matchResult.htx}`,
                  url: window.location.href,
                }).catch(() => {});
              } else {
                navigator.clipboard?.writeText?.(window.location.href);
                alert('Đã sao chép liên kết truy xuất nguồn gốc!');
              }
            }}
            className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-extrabold text-base shadow flex items-center justify-center gap-2"
          >
            <span>💬</span>
            <span>Chia sẻ nguồn gốc</span>
          </button>
        </div>
      </div>
    </div>
  );
};
