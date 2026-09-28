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
  const { screenParams, navigateTo, packages, harvests, farmZones, diaries, members, processingLots } = useApp();
  const rawCode = (screenParams?.code || '').trim();

  // Helper to safely get farmer name
  const getFarmerName = (zone: any, fallback: string) => {
    if (!zone) return fallback;
    if (zone.ownerName) return zone.ownerName;
    const m = members.find((mem) => mem.id === zone.ownerId);
    return m ? m.name : fallback;
  };

  // Validate and match code
  const matchResult = useMemo(() => {
    if (!rawCode) return null;

    // 1. Direct or partial match in context packages
    const pkg = packages.find(
      (p) =>
        p.code.toLowerCase() === rawCode.toLowerCase() ||
        p.qrCodeUrl.toLowerCase().includes(rawCode.toLowerCase()) ||
        rawCode.toLowerCase().includes(p.code.toLowerCase())
    );

    // 2. Check known static aliases
    const isRiceBT7 = rawCode.includes('AN-BT7') || rawCode.includes('BT7-089');
    const isRiceST25 = rawCode.includes('AN-ST25') || rawCode.includes('ST25-045');
    const isGa = rawCode.includes('DT-GA') || rawCode.includes('GA-012');
    const isNhan = rawCode.includes('QT-NHAN') || rawCode.includes('NHAN-005');

    if (!pkg && !isRiceBT7 && !isRiceST25 && !isGa && !isNhan) {
      return null; // INVALID CODE
    }

    // Nếu tìm thấy gói hàng thực tế trong packages, ưu tiên hiển thị chuỗi dữ liệu thực
    if (pkg) {
      const harvest = harvests.find((h) => h.id === pkg.harvestLotId || h.code === pkg.harvestLotCode);
      const zone = farmZones.find((z) => z.id === harvest?.farmZoneId);
      const htx = HTX_LIST[pkg.htxId] || HTX_LIST.anninh;

      // Thông tin sơ chế từ snapshot hoặc liên kết
      const procSnapshot = pkg.processingSnapshot;
      const procLot = processingLots.find((p) => p.id === pkg.processingLotId || p.harvestLotId === harvest?.id);
      const hasProc = procSnapshot?.hasProcessing ?? (!!pkg.processingLotId || !!procLot || harvest?.processingStatus === 'da_so_che');

      const procMethod = procSnapshot?.method || procLot?.method || harvest?.processingInfo?.method || 'Xay xát, làm sạch phân loại';
      const procOut = procSnapshot?.outputQuantity || procLot?.outputQuantity || harvest?.processingInfo?.outputQuantity;
      const procLoss = procSnapshot?.lossRatePercent || procLot?.lossRatePercent || harvest?.processingInfo?.lossRatePercent;

      const zoneDiaries = zone ? diaries.filter((d) => d.farmZoneId === zone.id) : [];

      const journey: JourneyStep[] = [
        {
          time: harvest?.seasonName || zone?.season || 'Vụ Canh tác',
          title: `1. Vùng canh tác & Mùa vụ: ${zone?.name || 'Vùng sản xuất HTX'}`,
          desc: `Mã số vùng trồng (MSVT): ${zone?.zoneCode || harvest?.zoneCode || 'MSVT-HTX'}. Hộ sản xuất: ${getFarmerName(zone, harvest?.ownerName || 'Hộ thành viên HTX')}. Giống: ${harvest?.variety || zone?.variety || 'Nông sản an toàn'}.`,
        },
      ];

      // Gắn thêm 2 nhật ký thực tế nếu có
      if (zoneDiaries.length > 0) {
        zoneDiaries.slice(0, 2).forEach((d) => {
          journey.push({
            time: d.date,
            title: `Canh tác: ${d.workTypeName}`,
            desc: `${d.suppliesUsed ? `Vật tư: ${d.suppliesUsed}. ` : ''}${d.notes || 'Thực hiện chuẩn VietGAP.'}`,
          });
        });
      }

      // Bước thu hoạch
      journey.push({
        time: harvest?.date || 'Thu hoạch',
        title: `2. Thu hoạch - Lô: ${harvest?.code || pkg.harvestLotCode || 'TH-HTX'}`,
        desc: `Sản lượng đạt ${harvest?.yieldQuantity?.toLocaleString() || ''} ${harvest?.unit || 'kg'}${
          harvest?.grade1Quantity !== undefined
            ? ` (Loại 1: ${harvest.grade1Quantity.toLocaleString()} ${harvest.unit}, Loại 2: ${harvest.grade2Quantity?.toLocaleString() || 0} ${harvest.unit})`
            : ''
        }.${harvest?.qualityMetric ? ` Chỉ số chất lượng: ${harvest.qualityMetric}.` : ''}`,
      });

      // Bước sơ chế (hoặc không sơ chế)
      if (hasProc) {
        journey.push({
          time: procSnapshot?.date || procLot?.date || harvest?.processingInfo?.date || harvest?.date || 'Sơ chế',
          title: `3. Sơ chế: ${procMethod}`,
          desc: `Ra thành phẩm: ${procOut?.toLocaleString() || ''} ${harvest?.unit || 'kg'}${procLoss !== undefined ? ` (Hao hụt sơ chế: ${procLoss}%)` : ''}. Đảm bảo vệ sinh an toàn thực phẩm.`,
        });
      } else {
        journey.push({
          time: harvest?.date || 'Không sơ chế',
          title: `3. Không qua sơ chế nhiệt (Đóng gói trực tiếp)`,
          desc: `Nông sản tươi thu hoạch đạt tiêu chuẩn chất lượng cao được chuyển thẳng sang đóng gói bao bì chuyên dụng.`,
        });
      }

      // Bước đóng gói
      journey.push({
        time: pkg.createdDate,
        title: `4. Đóng gói dán tem QR: ${pkg.productName}`,
        desc: `Quy cách: ${pkg.packagingSpec || `${pkg.packQuantity} ${pkg.unit}`}. Tiêu chuẩn: ${pkg.standard}. Hạn sử dụng: ${pkg.expiryDate}. Mã tem QR: ${pkg.code}.`,
      });

      return {
        code: pkg.code,
        name: pkg.productName,
        htx: htx.name,
        location: htx.address,
        farmer: `${getFarmerName(zone, harvest?.ownerName || 'Hộ thành viên')} (Hộ thành viên HTX)`,
        zone: `${zone?.name || harvest?.farmZoneName || 'Vùng trồng'} ${zone?.zoneCode ? `(${zone.zoneCode})` : ''}`,
        season: harvest?.seasonName || zone?.season || 'Vụ Canh tác',
        lotCode: pkg.harvestLotCode || harvest?.code || 'TH-HTX-2026',
        processingSummary: hasProc ? `${procMethod} (Hao hụt: ${procLoss || 0}%)` : 'Không sơ chế (Đóng gói trực tiếp)',
        standard: pkg.standard,
        photo: harvest?.photoUrl || 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=600&auto=format&fit=crop&q=80',
        harvestDate: harvest?.date || 'Đang cập nhật',
        packDate: pkg.createdDate,
        expiryDate: pkg.expiryDate,
        journey,
      };
    }

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
        zone: zone?.name || 'Khu chuồng nuôi thả vườn Vườn Nhãn (Đàn 450 con)',
        season: harvest?.seasonName || 'Lứa gà thịt Tết 2026',
        lotCode: harvest?.code || 'TH-DT-2026-001',
        processingSummary: 'Kiểm dịch thú y & Làm sạch hút chân không',
        standard: 'OCOP 4 sao • Chuỗi nông sản an toàn Hưng Yên',
        photo: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=600&auto=format&fit=crop&q=80',
        harvestDate: harvest?.date || '10/09/2026',
        packDate: '12/09/2026',
        expiryDate: '12/10/2026',
        journey: [
          { time: '02/2026', title: '1. Vùng nuôi & Con giống', desc: 'Gà Đông Tảo thuần chủng đời F1 chân vảy rồng tại Khu chuồng Vườn Nhãn.' },
          { time: '05/2026', title: 'Chăm sóc sinh học', desc: 'Thức ăn ngô mảnh ủ men vi sinh, uống nước thảo dược tự nhiên.' },
          { time: '10/09/2026', title: '2. Xuất chuồng', desc: 'Xuất chuồng đàn 50 con tuyển chọn, trọng lượng TB 4.2 kg/con.' },
          { time: '11/09/2026', title: '3. Sơ chế kiểm dịch', desc: 'Giết mổ kiểm dịch thú y & làm sạch hút chân không đạt 46 con thành phẩm.' },
          { time: '12/09/2026', title: '4. Đóng gói dán tem QR', desc: 'Đóng gói hút chân không, dán tem QR truy xuất điện tử HTX Đông Tảo.' },
        ] as JourneyStep[],
      };
    }

    if (isNhan) {
      const harvest = harvests.find((h) => h.htxId === 'quyetthang');
      const zone = farmZones.find((z) => z.id === harvest?.farmZoneId || z.id === 'fz-04');
      const htx = HTX_LIST.quyetthang;
      return {
        code: rawCode || 'TXNG-HY-QT-NHAN-005',
        name: 'Nhãn lồng tiến vua Hương Chi Hưng Yên (Hộp 1kg)',
        htx: htx.name,
        location: htx.address,
        farmer: `${getFarmerName(zone, 'Bác Phạm Thị Mai')} (Hộ thành viên tiêu biểu)`,
        zone: zone?.name || 'Vườn Nhãn Hương Chi - Khu A (1,2 hecta)',
        season: harvest?.seasonName || 'Vụ Nhãn 2026',
        lotCode: harvest?.code || 'TH-QT-2026-001',
        processingSummary: 'Sấy dẻo nhiệt độ thấp (Long nhãn tiến vua)',
        standard: 'VietGAP • Chỉ dẫn địa lý Nhãn lồng Hưng Yên',
        photo: 'https://images.unsplash.com/photo-1618897996318-5a901fa6ca71?w=600&auto=format&fit=crop&q=80',
        harvestDate: harvest?.date || '07/09/2026',
        packDate: '10/09/2026',
        expiryDate: '20/09/2026',
        journey: [
          { time: '01/2026', title: '1. Vùng trồng & Mùa vụ', desc: 'Vườn Nhãn Hương Chi Khu A đạt chứng nhận VietGAP.' },
          { time: '07/09/2026', title: '2. Thu hoạch chọn lọc', desc: 'Hái tay từng chùm quả to đều, cùi dày ráo nước, độ ngọt 19° Brix.' },
          { time: '08/09/2026', title: '3. Sơ chế sấy dẻo', desc: 'Sấy dẻo nhiệt độ thấp tách vỏ hạt, giữ nguyên hương vị tự nhiên.' },
          { time: '10/09/2026', title: '4. Đóng hộp dán tem QR', desc: 'Đóng hộp cao cấp 1kg có tem QR chống hàng giả của HTX Quyết Thắng.' },
        ] as JourneyStep[],
      };
    }

    if (isRiceST25) {
      const harvest = harvests.find((h) => h.farmZoneId === 'fz-02');
      const zone = farmZones.find((z) => z.id === 'fz-02');
      const htx = HTX_LIST.anninh;
      return {
        code: rawCode || 'TXNG-HY-AN-ST25-045',
        name: 'Gạo thượng hạng ST25 Hưng Yên (Túi 5kg)',
        htx: htx.name,
        location: htx.address,
        farmer: `${getFarmerName(zone, 'Bác Nguyễn Văn An')} (Hộ thành viên HTX)`,
        zone: zone?.name || 'Thửa Cánh Đồng Chợ (4.200 m²)',
        season: harvest?.seasonName || 'Vụ Xuân 2026',
        lotCode: harvest?.code || 'TH-AN-2026-002',
        processingSummary: 'Xay xát gạo lứt hữu cơ (giữ cám)',
        standard: 'Hữu cơ sinh học • Chuẩn OCOP 4 sao',
        photo: 'https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?w=600&auto=format&fit=crop&q=80',
        harvestDate: harvest?.date || '28/05/2026',
        packDate: '14/09/2026',
        expiryDate: '14/03/2027',
        journey: [
          { time: '06/2026', title: '1. Vùng trồng & Mùa vụ', desc: 'Gieo mạ cấy lúa ST25 hữu cơ tại Thửa Cánh Đồng Chợ (MSVT-AN-02).' },
          { time: '28/05/2026', title: '2. Thu hoạch máy gặt', desc: 'Gặt đập liên hợp sấy đạt độ ẩm 14.2%, sản lượng 1.800 kg.' },
          { time: '12/09/2026', title: '3. Xay xát & Giữ cám', desc: 'Xay xát giữ lớp màng cám dinh dưỡng, tỷ lệ thu hồi 75%.' },
          { time: '14/09/2026', title: '4. Đóng gói dán tem QR', desc: 'Đóng túi 5kg dán tem QR truy xuất điện tử chuẩn VietGAP.' },
        ] as JourneyStep[],
      };
    }

    // Default valid product: Bac Thom 7 (An Ninh)
    const harvest = harvests.find((h) => h.farmZoneId === 'fz-01');
    const zone = farmZones.find((z) => z.id === 'fz-01');
    const htx = HTX_LIST.anninh;

    return {
      code: rawCode || 'TXNG-HY-AN-BT7-089',
      name: 'Gạo sạch Bắc Thơm số 7 Hưng Yên (Túi 5kg)',
      htx: htx.name,
      location: htx.address,
      farmer: `${getFarmerName(zone, 'Bác Nguyễn Văn An')} (Hộ thành viên HTX)`,
      zone: zone?.name || 'Thửa Đầm Bông - Cánh đồng Lớn (3.500 m²)',
      season: harvest?.seasonName || 'Vụ Xuân 2026',
      lotCode: harvest?.code || 'TH-AN-2026-001',
      processingSummary: 'Xay xát bóc vỏ trấu & sàng lọc đánh bóng',
      standard: 'VietGAP • OCOP 4 sao • Không hóa chất cấm',
      photo: 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=600&auto=format&fit=crop&q=80',
      harvestDate: harvest?.date || '15/05/2026',
      packDate: '17/09/2026',
      expiryDate: '17/03/2027',
      journey: [
        { time: '01/2026', title: '1. Vùng canh tác & Mùa vụ', desc: 'Thửa Đầm Bông (MSVT-AN-01), Vụ Xuân 2026, giống Bắc Thơm 7.' },
        { time: '15/05/2026', title: '2. Thu hoạch máy gặt', desc: 'Thu hoạch 1.200 kg lúa tươi chất lượng Loại 1: 1.000 kg, Loại 2: 200 kg.' },
        { time: '16/09/2026', title: '3. Xay xát sơ chế', desc: 'Tách trấu bóc vỏ đạt 816 kg gạo thành phẩm (hao hụt 32%).' },
        { time: '17/09/2026', title: '4. Đóng gói dán tem QR', desc: 'Đóng túi 5kg dán tem QR truy xuất điện tử HTX An Ninh.' },
      ] as JourneyStep[],
    };
  }, [rawCode, packages, harvests, farmZones, diaries, members, processingLots]);

  // CASE 1: INVALID / UNVERIFIED QR CODE
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
            <button
              onClick={() => {
                alert('Đã gửi phản ánh mã tem nghi ngờ giả mạo tới Ban Quản trị Hợp tác xã và Chi cục QLCL Nông lâm Thủy sản Hưng Yên.');
              }}
              className="w-full py-3 bg-red-50 hover:bg-red-100 text-red-700 rounded-2xl font-bold text-xs border border-red-200"
            >
              Báo cáo mã tem giả mạo
            </button>
          </div>
        </div>
      </div>
    );
  }

  // CASE 2: VALID QR CODE
  return (
    <div className="pb-24 bg-slate-50 min-h-screen">
      <Header
        title="Thông tin nguồn gốc"
        voiceText={`Sản phẩm ${matchResult.name}, sản xuất bởi ${matchResult.htx}, hộ nông dân ${matchResult.farmer}. Đạt tiêu chuẩn ${matchResult.standard}.`}
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
            <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur text-white text-xs px-3 py-1 rounded-full font-bold">
              {matchResult.standard}
            </div>
          </div>

          <div className="p-5 space-y-3">
            <h2 className="text-2xl font-extrabold text-slate-900 leading-tight">
              {matchResult.name}
            </h2>

            <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-1.5 text-sm text-emerald-950">
              <div>• <strong>Hợp tác xã:</strong> {matchResult.htx}</div>
              <div>• <strong>Địa chỉ:</strong> {matchResult.location}</div>
              <div>• <strong>Hộ sản xuất:</strong> {matchResult.farmer}</div>
              <div>• <strong>Vùng canh tác:</strong> {matchResult.zone}</div>
              <div>• <strong>Mùa vụ:</strong> <span className="font-bold text-emerald-800">{matchResult.season}</span></div>
              <div>• <strong>Mã lô thu hoạch:</strong> <span className="font-mono font-bold">{matchResult.lotCode}</span></div>
              <div>• <strong>Công đoạn sơ chế:</strong> <span className="font-semibold text-blue-900">{matchResult.processingSummary}</span></div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500 font-bold block">Ngày thu hoạch:</span>
                <span className="text-sm font-extrabold text-slate-800">{matchResult.harvestDate}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500 font-bold block">Hạn dùng đến:</span>
                <span className="text-sm font-extrabold text-slate-800">{matchResult.expiryDate}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Production Timeline Journey (Req 9) */}
        <div className="bg-white rounded-3xl p-5 border-2 border-slate-200 shadow-sm space-y-4">
          <h3 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <span>🌱</span> Hành trình Vùng → Mùa vụ → Thu hoạch → Sơ chế → Đóng gói
          </h3>

          <div className="relative pl-6 space-y-5 border-l-4 border-emerald-500 ml-3 py-1">
            {matchResult.journey.map((item, index) => (
              <div key={index} className="relative">
                {/* Timeline node circle */}
                <div className="absolute -left-[31px] top-0.5 w-6 h-6 rounded-full bg-emerald-600 border-4 border-white shadow-sm flex items-center justify-center text-[10px] text-white font-bold">
                  {index + 1}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                      {item.time}
                    </span>
                    <h4 className="text-base font-extrabold text-slate-900">{item.title}</h4>
                  </div>
                  <p className="text-sm text-slate-600 mt-1 leading-relaxed">{item.desc}</p>
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
                alert('Đã sao chép liên kết truy xuất nguồn gốc. Bác có thể dán gửi qua tin nhắn Zalo!');
              }
            }}
            className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-extrabold text-base shadow flex items-center justify-center gap-2"
          >
            <span>💬</span>
            <span>Gửi qua Zalo</span>
          </button>
        </div>
      </div>
    </div>
  );
};
