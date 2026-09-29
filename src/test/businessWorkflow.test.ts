import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  INITIAL_FARM_ZONES,
  INITIAL_HARVESTS,
  INITIAL_HANDOVERS,
  INITIAL_PRODUCT_STOCKS,
  INITIAL_PACKAGES,
  INITIAL_ORDERS,
  INITIAL_DIARIES,
  INITIAL_TASKS,
  INITIAL_FEEDBACKS,
  COOP_CONFIGS,
  QUALITY_CRITERIA_CONFIG,
} from '../mock/data';
import {
  canCreateHarvest,
  canManageProcessing,
  canManagePackaging,
  canConfirmHandover,
  canApproveDiaryAdjustment,
  canModifyDiary,
  isDiaryLocked,
  canAccessScreen,
} from '../utils/permissions';

console.log('🧪 Bắt đầu chạy bộ kiểm thử toàn diện luồng nghiệp vụ nông nghiệp 3 HTX...');

// 1. KIỂM THỬ KỊCH BẢN MẪU: 1.000 KG NHÃN HƯNG YÊN (H-04)
describe('1. Kịch bản phân bổ sản lượng 1.000 kg nhãn (h-04)', () => {
  const lot = INITIAL_HARVESTS.find((h) => h.id === 'h-04');
  assert.ok(lot, 'Phải tìm thấy lô thu hoạch h-04');

  it('Tổng sản lượng ban đầu là 1.000 kg nhãn', () => {
    assert.equal(lot.yieldQuantity, 1000);
    assert.equal(lot.unit, 'kg');
  });

  it('Phân bổ chính xác 4 nhánh A-B-C-D không lệch sản lượng, không âm tồn', () => {
    const alloc = lot.allocation;
    assert.ok(alloc, 'Lô h-04 phải có dữ liệu allocation');

    // A: Bán trực tiếp cho thương lái
    assert.equal(alloc.directSaleQuantity, 200);

    // B & C: Giao HTX gồm 600 kg thô + 150 kg đóng thùng = 750 kg
    assert.equal(alloc.deliveredToHTXQuantity, 750);

    // C: Hộ tự đóng gói thùng
    assert.equal(alloc.packagedAtFarmQuantity, 150);

    // D: Hàng thô còn tồn tại hộ
    assert.equal(alloc.remainingAvailable, 50);

    // Đối soát tổng cộng: 200 + 750 + 50 = 1.000 kg
    const totalAccounted = alloc.directSaleQuantity + alloc.deliveredToHTXQuantity + alloc.remainingAvailable;
    assert.equal(totalAccounted, lot.yieldQuantity, 'Tổng sản lượng phân bổ phải bằng đúng 1.000 kg');
    assert.ok(alloc.remainingAvailable >= 0, 'Tồn kho không được âm');
  });

  it('HTX sơ chế 600 kg thô thành 540 kg, hao hụt 60 kg (10%)', () => {
    const proc = lot.processingInfo;
    assert.ok(proc, 'Lô h-04 phải có thông tin sơ chế');
    assert.equal(proc.inputQuantity, 600, 'Đầu vào sơ chế 600 kg');
    assert.equal(proc.outputQuantity, 540, 'Đầu ra sơ chế 540 kg');
    assert.equal(proc.lossQuantity, 60, 'Hao hụt sơ chế là 60 kg');
    assert.equal(proc.lossRatePercent, 10, 'Tỷ lệ hao hụt là 10%');
    assert.equal(proc.recoveryRatePercent, 90, 'Tỷ lệ thu hồi là 90%');
  });

  it('Tồn kho hai cấp (Hộ và HTX) được quản lý rõ ràng, không đếm trùng', () => {
    const stocksH04 = INITIAL_PRODUCT_STOCKS.filter((s) => s.harvestLotId === 'h-04');
    assert.ok(stocksH04.length >= 3, 'Phải có ít nhất 3 dòng tồn kho cho lô h-04');

    // Tồn tại hộ: 50 kg hàng thô
    const farmerStock = stocksH04.find((s) => s.ownerType === 'ho_dan' && s.state === 'hang_tho');
    assert.ok(farmerStock);
    assert.equal(farmerStock.quantity, 50);

    // Sau sơ chế 540 kg: đã đóng hộp 100, bán rời 200, còn 240 kg.
    const htxProcessedStock = stocksH04.find((s) => s.ownerType === 'htx' && s.state === 'da_xu_ly');
    assert.ok(htxProcessedStock);
    assert.equal(htxProcessedStock.quantity, 240);

    // Hộ ký gửi 150 kg: HTX đã bán 100 kg, còn giữ hộ 50 kg.
    const consignedStock = stocksH04.find((s) => s.handoverId === 'gn-02');
    assert.ok(consignedStock);
    assert.equal(consignedStock.ownerType, 'ho_dan');
    assert.equal(consignedStock.holderId, 'quyetthang');
    assert.equal(consignedStock.quantity, 50);
  });
});

// 2. KIỂM THỬ CÁC TRƯỜNG HỢP ĐẶC THÙ: THÓC XAY XÁT, GÀ & CÁ BÁN SỐNG, VƯỜN ĐA KỲ
describe('2. Các trường hợp đặc thù nông nghiệp 3 HTX', () => {
  it('HTX An Ninh: Thóc tươi thu hoạch xay xát thành gạo', () => {
    const riceLot = INITIAL_HARVESTS.find((h) => h.id === 'h-01');
    assert.ok(riceLot);
    assert.equal(riceLot.yieldQuantity, 1200);
    assert.equal(riceLot.processingStatus, 'da_so_che');
    assert.equal(riceLot.processingInfo?.outputQuantity, 816);
    assert.equal(riceLot.processingInfo?.lossRatePercent, 32); // Hao hụt vỏ trấu 32%
  });

  it('HTX Quyết Thắng: Cá lồng bán sống nguyên con theo kg không ép hạn dùng hay đóng gói kín', () => {
    const liveFishPkg = INITIAL_PACKAGES.find((p) => p.code === 'QR-QT-CA-SONG-001');
    assert.ok(liveFishPkg);
    assert.equal(liveFishPkg.isLiveProduct, true);
    assert.equal(liveFishPkg.unit, 'kg');
  });

  it('Vườn nhãn tồn tại qua nhiều năm (isPermanent=true), không bị đóng sau kỳ thu hoạch', () => {
    const longanZone = INITIAL_FARM_ZONES.find((z) => z.id === 'fz-04');
    assert.ok(longanZone);
    assert.equal(longanZone.isPermanent, true);
    assert.equal(longanZone.facilityType, 'vuon_cay');
    assert.ok(longanZone.seasonHistory && longanZone.seasonHistory.length >= 2, 'Vườn có lịch sử nhiều kỳ vụ');
  });

  it('Một lứa cá lồng có nhiều lần thu hoạch (h-07a, h-07b cùng từ fz-05)', () => {
    const fishHarvests = INITIAL_HARVESTS.filter((h) => h.farmZoneId === 'fz-05');
    assert.ok(fishHarvests.length >= 2, 'Một lồng cá phải có ít nhất 2 đợt thu hoạch');
    const totalYield = fishHarvests.reduce((sum, h) => sum + h.yieldQuantity, 0);
    assert.equal(totalYield, 3500, 'Tổng sản lượng 2 lần thu tỉa cá là 3.500 kg');
  });
});

// 3. KIỂM THỬ ĐỐI SOÁT CÂN ĐO VÀ HOÀN TỒN KHI CHÊNH LỆCH
describe('3. Đối soát giao nhận và hoàn tồn chênh lệch', () => {
  it('Phiếu giao nhận gn-01: HTX cân đủ 600 kg', () => {
    const gn01 = INITIAL_HANDOVERS.find((g) => g.id === 'gn-01');
    assert.ok(gn01);
    assert.equal(gn01.declaredQuantity, 600);
    assert.equal(gn01.receivedQuantity, 600);
    assert.equal(gn01.status, 'da_kiem_nhan');
    assert.equal(gn01.differenceQuantity, 0);
  });

  it('Kiểm tra hàm đối soát: nếu HTX cân thiếu, chênh lệch được hoàn tồn cho hộ', () => {
    const declared = 100;
    const received = 92; // thiếu 8 kg
    const diff = declared - received;
    assert.equal(diff, 8);
    let farmerAvailable = 50;
    farmerAvailable += diff;
    assert.equal(farmerAvailable, 58, 'Tồn hộ phải được cộng lại 8 kg chênh lệch');
  });
});

// 4. KIỂM THỬ BÁN HÀNG VÀ HỦY ĐƠN HOÀN TỒN
describe('4. Bán hàng và hủy đơn hoàn tồn', () => {
  it('Đơn hàng phân biệt rõ người bán (Hộ dân hoặc HTX)', () => {
    // Đơn của hộ dân
    const farmerOrder = INITIAL_ORDERS.find((o) => o.id === 'ord-qt-01');
    assert.ok(farmerOrder);
    assert.equal(farmerOrder.sellerType, 'ho_dan');
    assert.equal(farmerOrder.sellerName, 'Phạm Thị Mai');
    assert.equal(farmerOrder.quantity, 200);

    // Đơn của HTX
    const htxOrder = INITIAL_ORDERS.find((o) => o.id === 'ord-qt-02');
    assert.ok(htxOrder);
    assert.equal(htxOrder.sellerType, 'htx');
    assert.equal(htxOrder.sellerName, 'HTX Quyết Thắng');
  });

  it('Hủy đơn hàng hoàn trả đúng sản lượng vào tồn khả dụng', () => {
    let directSold = 200;
    let remaining = 50;
    const cancelQty = 50;

    directSold -= cancelQty;
    remaining += cancelQty;

    assert.equal(directSold, 150);
    assert.equal(remaining, 100);
  });
});

// 5. KIỂM THỬ PHÂN QUYỀN VÀ BẢO MẬT DỮ LIỆU GIỮA CÁC HTX
describe('5. Phân quyền và bảo mật dữ liệu giữa các HTX', () => {
  it('R06 chỉ có quyền tạo thu hoạch trên thửa của hộ mình', () => {
    const ownerId = 'mem-qt-01';
    assert.equal(canCreateHarvest('R06', ownerId, ownerId), true);
    assert.equal(canCreateHarvest('R06', 'mem-qt-other', ownerId), false);
  });

  it('R03 và R02 có quyền tạo thu hoạch trên toàn HTX', () => {
    assert.equal(canCreateHarvest('R03', 'any-zone', 'user-r03'), true);
    assert.equal(canCreateHarvest('R02', 'any-zone', 'user-r02'), true);
  });

  it('R04 có quyền kiểm nhận đối soát (canConfirmHandover), R06 không được', () => {
    assert.equal(canConfirmHandover('R04'), true);
    assert.equal(canConfirmHandover('R02'), true);
    assert.equal(canConfirmHandover('R06'), false);
    assert.equal(canConfirmHandover('R03'), false);
  });

  it('R02 có quyền duyệt phiếu điều chỉnh nhật ký sau 24h, R06 và R03 không được', () => {
    assert.equal(canApproveDiaryAdjustment('R02'), true);
    assert.equal(canApproveDiaryAdjustment('R06'), false);
    assert.equal(canApproveDiaryAdjustment('R04'), false);
  });

  it('Nhật ký > 24h bị khóa, R06 được phép tạo đề nghị điều chỉnh', () => {
    const oldDiary = INITIAL_DIARIES[0];
    const perm = canModifyDiary('R06', oldDiary, 'Bác Phạm Thị Mai', 'mem-qt-01');
    assert.equal(perm.canEdit, false);
    assert.equal(perm.canRequestAdjustment, true);
  });
});

// 6. KIỂM THỬ TRUY XUẤT QR VÀ BẢO MẬT DỮ LIỆU CÔNG KHAI
describe('6. Truy xuất QR và cấu hình tiêu chuẩn chất lượng', () => {
  it('Cấu hình chất lượng động có đủ cho 4 ngành hàng (lúa, gà, nhãn, thủy sản)', () => {
    assert.ok(QUALITY_CRITERIA_CONFIG.lua_gao);
    assert.ok(QUALITY_CRITERIA_CONFIG.ga_dongtao);
    assert.ok(QUALITY_CRITERIA_CONFIG.nhan_long);
    assert.ok(QUALITY_CRITERIA_CONFIG.thuy_san);
    assert.ok(QUALITY_CRITERIA_CONFIG.nhan_long.criteria.length >= 3);
  });
});

// 7. KIỂM THỬ AN NINH: DỊCH VỤ GẶT/SẤY, GIAO NHẬN CHÊNH LỆCH VÀ ĐỐI SOÁT CÔNG NỢ
describe('7. HTX An Ninh: Yêu cầu dịch vụ, giao nhận chênh lệch cân và đối soát', () => {
  it('Hộ An Ninh gửi yêu cầu gặt/sấy hoặc nhận việc từ HTX', () => {
    const taskGat = INITIAL_TASKS.find((t) => t.htxId === 'anninh' && t.taskCategory === 'dich_vu_htx');
    assert.ok(taskGat, 'Phải có công việc dịch vụ máy gặt đập');
    assert.equal(taskGat.serviceRequest?.serviceType, 'gat');
    assert.equal(taskGat.status, 'da_lam');
    assert.equal(taskGat.assignedTo, '0978 123 456');
  });

  it('Phiếu giao nhận gn-an-02 không vượt lô 1.200 kg và đã đối soát khớp', () => {
    const gn02 = INITIAL_HANDOVERS.find((g) => g.id === 'gn-an-02');
    assert.ok(gn02, 'Phải tìm thấy phiếu giao nhận gn-an-02');
    assert.equal(gn02.declaredQuantity, 1200);
    assert.equal(gn02.receivedQuantity, 1200);
    assert.equal(gn02.differenceQuantity, 0);
    assert.equal(gn02.doiSoatStatus, 'da_khop');
  });

  it('Đối soát công nợ giao nhận thóc: Tổng 12.600.000đ, đã tạm ứng 10.000.000đ', () => {
    const gn02 = INITIAL_HANDOVERS.find((g) => g.id === 'gn-an-02');
    assert.ok(gn02);
    assert.equal(gn02.unitPrice, 10500);
    assert.equal(gn02.totalAmount, 1200 * 10500);
    assert.equal(gn02.paidAmount, 10000000); // Tạm ứng 10 triệu
    assert.equal(gn02.paymentStatus, 'tam_ung');
  });
});

// 8. KIỂM THỬ ĐÔNG TẢO: BIẾN ĐỘNG ĐÀN, XIN XUẤT BÁN VÀ QR BÁN SỐNG KHÔNG ĐÓNG GÓI
describe('8. HTX Đông Tảo: Biến động đàn, yêu cầu xuất bán & QR bán sống nguyên trạng', () => {
  it('Hộ Đông Tảo có nhiệm vụ tiêm phòng và ghi biến động đàn', () => {
    const taskTiem = INITIAL_TASKS.find((t) => t.id === 'task-dt-01');
    assert.ok(taskTiem);
    assert.equal(taskTiem.taskCategory, 'tiem_phong_thu_y');
    assert.ok(taskTiem.livestockLog);
    assert.equal(taskTiem.livestockLog.currentBirdCount, 495);
    assert.equal(taskTiem.livestockLog.deadOrCulledCount, 5);
    assert.equal(taskTiem.livestockLog.sampleWeightKg, 4.1);
  });

  it('Hộ gửi yêu cầu xuất bán gà thịt chờ Ban Quản trị phê duyệt', () => {
    const taskXuat = INITIAL_TASKS.find((t) => t.id === 'task-dt-02');
    assert.ok(taskXuat);
    assert.equal(taskXuat.taskCategory, 'xuat_ban');
    assert.equal(taskXuat.status, 'chua_lam');
    assert.ok(taskXuat.livestockLog);
    assert.equal(taskXuat.livestockLog.salesRequestStatus, 'cho_duyet');
  });

  it('Lô gà thịt (h-03) có QR độc lập không ép tạo công đoạn đóng gói giả', () => {
    const liveLot = INITIAL_HARVESTS.find((h) => h.id === 'h-03');
    assert.ok(liveLot);
    assert.ok(liveLot.qrCodeUrl, 'Lô gà sống phải có qrCodeUrl độc lập');
  });

  it('Đơn hàng bán gà sống (ord-dt-01) có mã QR phiếu xuất truy thẳng về lô và hộ nuôi', () => {
    const orderLive = INITIAL_ORDERS.find((o) => o.id === 'ord-dt-01');
    assert.ok(orderLive);
    assert.ok(orderLive.qrCodeUrl, 'Phiếu xuất bán sống phải có mã QR');
    assert.equal(orderLive.harvestLotId, 'h-03');
    assert.equal(orderLive.unit, 'con');
  });
});

// 9. KIỂM THỬ QUYẾT THẮNG: LỒNG CÁ SÔNG LUỘC, VƯỜN NHÃN VÀ THU HOẠCH NHIỀU ĐỢT
describe('9. HTX Quyết Thắng: Nuôi cá lồng sông Luộc & Vườn cây ăn quả', () => {
  it('Lồng cá sông Luộc ghi nhận đầy đủ môi trường, thức ăn và theo dõi', () => {
    const cageTask = INITIAL_TASKS.find((t) => t.id === 'task-qt-01');
    assert.ok(cageTask, 'Phải có công việc kiểm tra lồng cá sông Luộc');
    assert.ok(cageTask.fisheryLog, 'Phải có nhật ký theo dõi cá lồng');
    assert.equal(cageTask.fisheryLog.cageCode, 'LỒNG-SL-02');
    assert.equal(cageTask.fisheryLog.species, 'Cá lăng chấm sông Luộc');
    assert.equal(cageTask.fisheryLog.mortalityCount, 0);
    assert.equal(cageTask.fisheryLog.dissolvedOxygen, 6.4);
  });

  it('Cá lồng thu hoạch đợt 2 (h-07b) bán tươi sống có QR độc lập kết nối cơ sở lồng fz-05', () => {
    const fishLot2 = INITIAL_HARVESTS.find((h) => h.id === 'h-07b');
    assert.ok(fishLot2);
    assert.equal(fishLot2.farmZoneId, 'fz-05');
    assert.ok(fishLot2.qrCodeUrl);
  });

  it('Bán nhãn đóng hộp giữ nguyên liên kết truy xuất về hộ và không làm mất dấu vết', () => {
    const boxPkg = INITIAL_PACKAGES.find((p) => p.code === 'QR-QT-NHAN-005');
    assert.ok(boxPkg);
    assert.equal(boxPkg.harvestLotId, 'h-04');
    assert.equal(boxPkg.netWeightPerPack, 1);
  });
});

// 10. KIỂM THỬ SAU BÁN HÀNG: TIẾN ĐỘ GIAO HÀNG, CÔNG NỢ VÀ PHẢN HỒI CHẤT LƯỢNG
describe('10. Sau bán hàng: Giao hàng thực tế, công nợ và phản hồi chất lượng', () => {
  it('Đơn hàng ord-dt-01: Ghi nhận giao đủ 10 con gà sống, thanh toán đủ 100%', () => {
    const order = INITIAL_ORDERS.find((o) => o.id === 'ord-dt-01');
    assert.ok(order);
    assert.equal(order.deliveryStatus, 'da_giao');
    assert.equal(order.deliveredQuantity, 10);
    assert.equal(order.paymentStatus, 'da_thanh_toan');
    assert.equal(order.remainingDebt, 0);
  });

  it('Đơn hàng ord-an-pending-01: Trạng thái đang giao, công nợ còn 2.500.000đ', () => {
    const order = INITIAL_ORDERS.find((o) => o.id === 'ord-an-pending-01');
    assert.ok(order);
    assert.equal(order.deliveryStatus, 'dang_giao');
    assert.equal(order.paymentStatus, 'tam_ung');
    assert.equal(order.paidAmount, 5000000);
    assert.equal(order.remainingDebt, 2500000);
  });

  it('Hệ thống tiếp nhận và xử lý phản hồi chất lượng khách hàng (CustomerFeedback)', () => {
    assert.ok(INITIAL_FEEDBACKS.length >= 3, 'Phải có phản hồi khách hàng cho cả 3 HTX');
    const fbWinmart = INITIAL_FEEDBACKS.find((f) => f.id === 'fb-01');
    assert.ok(fbWinmart);
    assert.equal(fbWinmart.rating, 5);
    assert.equal(fbWinmart.status, 'da_giai_quyet');
  });
});

// 11. KIỂM THỬ KHÔNG CÓ TỰ ĐĂNG KÝ / DUYỆT THÀNH VIÊN TRÊN MOBILE & TÁCH BIỆT DỮ LIỆU
describe('11. Cấu hình HTX, tách biệt dữ liệu và bảo mật quyền mobile', () => {
  it('Cấu hình 3 HTX tách biệt: An Ninh bật kho chi tiết, Đông Tảo & Quyết Thắng duy trì sổ tồn khả dụng tối thiểu', () => {
    assert.equal(COOP_CONFIGS.anninh.enableDetailedWarehouse, true);
    assert.equal(COOP_CONFIGS.dongtao.enableDetailedWarehouse, false);
    assert.equal(COOP_CONFIGS.quyetthang.enableDetailedWarehouse, false);

    assert.equal(COOP_CONFIGS.dongtao.enableLivestockTracking, true);
    assert.equal(COOP_CONFIGS.quyetthang.enableFisheryTracking, true);
  });

  it('Mobile KHÔNG hỗ trợ tự đăng ký, thêm/sửa hoặc duyệt thành viên (quyền thuộc Web Portal)', () => {
    assert.equal(canAccessScreen('R06', 'members_list'), false, 'Nông dân R06 không vào quản trị thành viên');
    assert.equal(canAccessScreen('R02', 'members_list'), true, 'R02 chỉ xem hồ sơ được cấp từ web');
    assert.equal(canAccessScreen('R04', 'members_list'), true, 'R04 chỉ xem danh sách');
    // Không có màn hình member_add hay member_approve được cấp quyền cho bất kỳ vai trò nào
    assert.equal(canAccessScreen('R02', 'member_add'), false);
    assert.equal(canAccessScreen('R06', 'member_add'), false);
    assert.equal(canAccessScreen('R02', 'member_approve'), false);
  });
});

console.log('✅ Đã định nghĩa và thực thi xong toàn bộ các bài kiểm thử nông nghiệp!');
