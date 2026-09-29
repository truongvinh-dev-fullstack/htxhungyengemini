# HƯỚNG DẪN MỞ VÀ TRẢI NGHIỆM DEMO ZALO MINI APP
## Hệ thống CSDL Thông tin Sản xuất & Truy xuất Nguồn gốc — 03 HTX Nông nghiệp Hưng Yên
**Tài liệu tham chiếu:** Module 3 — SRS v1.1 (*SRS_HeThong_HTX_HungYen_v1.1_Zalo_Login.md*)  
> **Lưu ý cập nhật phạm vi:**  
> - **Vùng và thửa:** Bản ghi sản xuất 1 cấp độc lập (`FarmZone`), không có cấu trúc vùng cha → thửa con.  
> - **Bỏ tổ và vai trò R05 (Tổ trưởng):** Mini App gồm 4 vai trò chính: `R06 Hộ dân`, `R04 Kế toán/Kho`, `R03 Cán bộ Kỹ thuật`, `R02 Ban Quản trị HTX`.  
> - **Quản lý thành viên chỉ đọc:** Mini App chỉ xem danh sách & hồ sơ thành viên. Việc thêm, phê duyệt và tự đăng ký thành viên được thực hiện trên Cổng thông tin Quản trị Web (Web Portal).

---

## I. CÁCH KHỞI ĐỘNG VÀ TRUY CẬP DEMO

### 1. Khởi động môi trường phát triển (Dev Server)
Mở cửa sổ dòng lệnh (Terminal / PowerShell) tại thư mục dự án `d:\Vinh\zaloapp\hungyenhtx` và chạy lệnh:

```bash
# Cài đặt thư viện (nếu mở trên máy mới)
npm install

# Khởi chạy server Zalo Mini App
npm run start
# hoặc: npx zmp start
```

### 2. Mở ứng dụng trên trình duyệt
* **Đường dẫn truy cập:** [http://localhost:3000/](http://localhost:3000/)
* Giao diện đã được tích hợp sẵn khung giả lập chuẩn Zalo Mobile Frame, hoạt động mượt mà trên Chrome, Edge, Safari hoặc mở trên trình duyệt điện thoại kết nối cùng mạng Wi-Fi.

---

## II. BẢNG TÀI KHOẢN VÀ DỮ LIỆU DEMO

Hệ thống đã chuẩn bị sẵn dữ liệu mẫu cho cả **3 HTX** đại diện 3 vùng đặc sản tỉnh Hưng Yên:

| HTX | Địa bàn | Nông sản chủ lực | Đại diện tài khoản mẫu |
|---|---|---|---|
| **HTX Dịch vụ Nông nghiệp An Ninh** | Tiền Lữ | Lúa sạch VietGAP (Bắc Thơm số 7) | Bác Nguyễn Văn An (62 tuổi) |
| **HTX Chăn nuôi & Kinh doanh Gà Đông Tảo** | Khoái Châu | Gà Đông Tảo thuần chủng tiến vua | Bác Trần Đình Trọng (58 tuổi) |
| **HTX Cây ăn quả đặc sản & NTTS Quyết Thắng** | TP. Hưng Yên | Nhãn lồng Hương Chi & Cá lăng lồng | Bác Phạm Thị Mai (65 tuổi) |

### Thanh chuyển đổi nhanh (Role & HTX Switcher)
Ở góc trên cùng của ứng dụng luôn có thanh ghim màu vàng hổ phách **"DEMO SỞ NN&PTNT"**:
* Bấm vào chữ **"Đổi vai trò / HTX ▼"** để mở menu chuyển đổi 1-chạm giữa 4 vai trò (`R06 Hộ dân`, `R04 Kế toán/Kho`, `R03 Cán bộ Kỹ thuật`, `R02 Lãnh đạo HTX`) và chuyển qua lại giữa 3 HTX mà không cần đăng xuất.

---

## III. KỊCH BẢN TRẢI NGHIỆM TỪNG LUỒNG CHỨC NĂNG (THEO MODULE 3)

### KỊCH BẢN 1: ĐĂNG NHẬP THUẦN ZALO & CHECK SĐT VỚI HTX (CN-3.1.1 – CN-3.1.2)
1. **Giao diện thuần Zalo:** Màn hình đăng nhập duy nhất chỉ có nút lớn: **"⚡ ĐĂNG NHẬP BẰNG ZALO"** (hoàn toàn không có tài khoản, mật khẩu hay chọn HTX trước).
2. **Xin cấp quyền SĐT Zalo (Zalo Permission Dialog):** Bấm nút đăng nhập $\rightarrow$ Xuất hiện pop-up chuẩn Zalo yêu cầu cấp quyền định danh & Số điện thoại Zalo.
3. **Thử nghiệm trường hợp ĐĂNG NHẬP THÀNH CÔNG:**
   * Chọn số điện thoại của **Bác Nguyễn Văn An** (`0978 123 456`) $\rightarrow$ Bấm *"Cho phép & Đăng nhập"*.
   * Hệ thống tự động đối soát với CSDL HTX, xác định bác An thuộc **HTX An Ninh (Lúa sạch)**, gán quyền Hộ nông dân R06 và đưa thẳng vào Trang chủ.
   * Thử lại với số `0988 765 432` (Bác Trọng - HTX Đông Tảo) hoặc `0904 555 888` (Bác Mai - HTX Quyết Thắng) để kiểm tra tính năng tự động nhận diện đúng HTX theo SĐT.
4. **Thử nghiệm trường hợp SĐT CHƯA ĐĂNG KÝ Ở HTX:**
   * Mở lại màn hình đăng nhập $\rightarrow$ Bấm *"ĐĂNG NHẬP BẰNG ZALO"*.
   * Chọn số điện thoại mẫu `0999 888 777` (hoặc tự gõ 1 số điện thoại bất kỳ chưa có trong HTX).
   * Bấm *"Cho phép & Đăng nhập"*.
   * **Kết quả:** Hệ thống lập tức hiển thị màn hình cảnh báo rõ ràng kèm trợ lý giọng nói:
     > *"⚠️ Số điện thoại [SĐT] chưa được đăng ký trong danh sách thành viên của bất kỳ Hợp tác xã nào trong hệ thống. Bà con vui lòng liên hệ Ban Quản trị HTX tại địa phương để được hỗ trợ đăng ký."*
     > *(Kèm hotline trực tiếp của HTX An Ninh, Đông Tảo, Quyết Thắng và nút "Thử lại với số khác").*
5. **Trang cá nhân không còn đổi mật khẩu:** Vào mục *Tài khoản* $\rightarrow$ Quan sát mục liên kết Zalo xác thực an toàn không mật khẩu, chỉ có nút *"Đăng xuất khỏi Mini App"*.

---

### KỊCH BẢN 2: TRANG CHỦ & TRỢ LÝ GIỌNG NÓI (HOME)
1. **Lời chào & Thời tiết:** Quan sát banner tên thành viên, chức danh tổ và dự báo thời tiết nông vụ Hưng Yên hôm nay.
2. **Trợ lý giọng nói (Voice Assistant):** Bấm vào icon **📢** hoặc nút **🔊 "Đọc to"** ở góc trên phải. Hệ thống sẽ đọc to lời chào và hướng dẫn bằng giọng tiếng Việt (kèm bong bóng thoại trực quan, có nút *Đọc lại* và *Đóng*).
3. **Nhắc ghi nhật ký hôm nay (CN-3.5.4):** Nếu hôm nay chưa ghi nhật ký, Trang chủ hiển thị lời nhắc *"Ghi lại việc bác đã làm"* kèm nút *"Ghi ngay ➜"*. Việc dự kiến đến hạn còn được nhắc trong mục Thông báo.
4. **Lưới chức năng ô lớn:** Bố cục dạng thẻ card lớn vuông vức, chạm mở nhanh từng phần.

---

### KỊCH BẢN 3: NHẬT KÝ SẢN XUẤT (CN-3.5.1 – CN-3.5.6) ★ ƯU TIÊN 1
1. **Xem danh sách timeline:** Từ Trang chủ, chạm ô **"📖 Nhật ký sản xuất"**. Các việc đã ghi được sắp xếp theo ngày kèm biểu tượng trực quan; áp dụng cho ruộng, vườn, chuồng nuôi và ao/lồng cá.
2. **Luồng 4 bước thêm nhật ký mới (CN-3.5.2):** Bấm nút **"➕ Ghi mới"**:
   * *Bước 1 (Chọn ngày & Vùng):* Bác nông dân chọn nhanh nút *"📅 Hôm nay"* hoặc *"📅 Hôm qua"*, chọn thửa ruộng từ danh sách. Bấm *"Tiếp tục: Bước 2"*.
   * *Bước 2 (Chọn việc đã làm):* Ứng dụng gợi ý tối đa ba việc gần ngày dự kiến của đúng vùng và vụ/lứa; bác có thể chạm một gợi ý hoặc tự chọn nhiều loại việc đã làm. Gợi ý không bắt buộc và không tự xác nhận hoàn thành. Nhập vật tư (nếu có), rồi bấm *"Sang Bước 3"*.
   * *Bước 3 (Chụp ảnh camera trực tiếp):* Khung ngắm camera đồng ruộng với chỉ dấu vị trí xã An Ninh, cho phép chọn các ảnh chụp thực tế sinh động. Bấm *"Sang Bước 4"*.
   * *Bước 4 (Kiểm tra & Lưu):* Xem lại bản tóm tắt hiển thị toàn bộ các việc đã chọn kèm icon, nhập ghi chú ngắn $\rightarrow$ Bấm **"💾 LƯU NHẬT KÝ"**.
3. **Kiểm tra kết quả:** Quay lại Trang chủ, banner nhắc nhở màu cam tự động biến mất vì hệ thống ghi nhận hộ đã hoàn thành nhật ký trong ngày!
4. **Kiểm tra quy tắc khóa sau 24 giờ (CN-3.5.6):**
   * Mở 1 nhật ký cũ (trên 24 giờ): Hiển thị huy hiệu khóa xám **🔒 "Đã lưu, không thể sửa"** để bảo vệ dữ liệu phục vụ truy xuất nguồn gốc.
   * Mở 1 nhật ký vừa tạo (dưới 24 giờ): Hiển thị huy hiệu **⏳ "Có thể sửa (trong 24h)"** kèm nút xóa bản ghi nếu nhập nhầm.

---

### KỊCH BẢN 4: QUÉT MÃ TRUY XUẤT NGUỒN GỐC (CN-3.10.1 – CN-3.10.2) ★ ƯU TIÊN 1
1. **Mở camera quét:** Tại Trang chủ, chạm ô **"📷 Quét mã xem nguồn gốc"**.
2. **Giao diện quét:** Khung quét laser có góc định vị và hướng dẫn: *"Giữ yên điện thoại cách tem 15-20cm"*.
3. **Thử nghiệm quét nhanh 3 sản phẩm mẫu:**
   * Chạm nút: *"Quét mẫu: Gạo sạch Bắc Thơm An Ninh (5kg)"*.
   * Hoặc: *"Quét mẫu: Gà Đông Tảo thuần chủng tiến vua"*.
   * Hoặc: *"Quét mẫu: Nhãn lồng tiến vua Quyết Thắng"*.
4. **Xem kết quả truy xuất (CN-2.12.1):** Màn hình hiển thị giấy chứng nhận VietGAP/OCOP, tên HTX, tên hộ sản xuất, số lô thu hoạch và **Hành trình từ đồng ruộng đến bàn ăn** dạng timeline nối liền từ chọn giống $\rightarrow$ chăm sóc sinh học $\rightarrow$ thu hoạch $\rightarrow$ đóng gói.
5. **Chia sẻ:** Có nút **"💬 Gửi qua Zalo"** để gửi trang truy xuất cho người mua hàng.

---

### KỊCH BẢN 5: ĐÓNG GÓI SẢN PHẨM & MÃ QR (CN-3.7.1 – CN-3.7.4) ★ ƯU TIÊN 1
1. **Mở danh sách:** Chạm ô **"📦 Đóng gói sản phẩm"** để xem các mã sản phẩm đã dán tem.
2. **Tạo mã đóng gói mới (CN-3.7.2):** Bấm *"➕ Tạo mã mới"*:
   * Chọn lô thu hoạch đầu vào (ví dụ: `TH-AN-2026-001`).
   * Nhập số lượng gói cần dán tem bằng **bộ đếm +/-** hoặc chọn nhanh `+10`, `+50`, `+100`.
   * Bấm **"✨ TỰ ĐỘNG SINH MÃ QR SẢN PHẨM"**.
3. **Màn hình in tem QR (CN-3.7.4):** Hiển thị mẫu tem vuông bo góc có logo HTX ở chính giữa mã QR, tên sản phẩm, ngày đóng gói và 2 nút thao tác:
   * **"💬 CHIA SẺ QUA ZALO"**: Gửi ảnh mã tem cho đại lý/khách mua.
   * **"🖨️ IN TEM MÃ QR"**: Kích hoạt lệnh in tem nhãn để dán lên bao bì.

---

### KỊCH BẢN 6: VÙNG SẢN XUẤT, THU HOẠCH & BÁN HÀNG (ƯU TIÊN 2)
1. **Vùng sản xuất của tôi (CN-3.3.1 – CN-3.3.4):**
   * Danh sách thửa ruộng/khu chuồng trại kèm ảnh minh họa.
   * **Dự báo sản lượng (CN-3.3.4):** Ô số to dễ hiểu: *"Dự kiến thu: 2,1 tấn — còn khoảng 25 ngày"*.
   * Nút *"Thêm vùng"*: Chọn Giống và Mùa vụ từ danh mục mẫu cấu hình sẵn, không cần gõ phím.
2. **Thu hoạch (CN-3.6.1 – CN-3.6.3):**
   * Bấm *"Thu hoạch"* $\rightarrow$ *"➕ Thêm lô"*: Chọn vùng $\rightarrow$ Nhập sản lượng bằng bộ đếm +/- $\rightarrow$ Chụp ảnh nông sản $\rightarrow$ Bấm lưu.
   * Trong chi tiết lô thu hoạch có nút chuyển nhanh: *"📦 Đóng gói & Tạo mã QR từ lô này"*.
3. **Bán hàng & Hóa đơn điện tử (CN-3.9.1 – CN-3.9.5):**
   * Xem thẻ doanh thu tháng rút gọn cho di động.
   * Bấm *"➕ Tạo đơn mới"*: Chọn khách hàng, chọn sản phẩm, chỉnh số lượng bằng bộ đếm +/-.
   * Mở chi tiết đơn hàng $\rightarrow$ Bấm **"🧾 XEM TRƯỚC HÓA ĐƠN ĐIỆN TỬ"** để kiểm tra mẫu hóa đơn VAT điện tử của HTX và gửi qua Zalo cho khách hàng.

---

### KỊCH BẢN 7: TRẢI NGHIỆM VAI TRÒ KỸ THUẬT (R03), KẾ TOÁN (R04) & BAN QUẢN TRỊ (R02)

#### A. Trải nghiệm vai trò R03 Cán bộ Kỹ thuật:
1. Trên thanh ghim đầu trang, bấm *"Đổi vai trò / HTX ▼"* $\rightarrow$ Chọn **"R03: Cán bộ Kỹ thuật"**.
2. Trang chủ tự động hiển thị các chức năng: Giám sát vùng sản xuất, Lô sơ chế, Đóng gói dán tem và Quét thẩm định mã QR.
3. Bấm vào **"Danh sách thành viên"**: Xem hồ sơ xã viên, số điện thoại, địa chỉ và các thửa ruộng canh tác (quyền xem chỉ đọc).

#### B. Trải nghiệm vai trò R04 Kế toán / Quản lý kho:
1. Trên thanh ghim, chọn **"R04: Kế toán / Kho"**.
2. Trang chủ xuất hiện thêm ô: **"🏬 Kho vật tư (Chỉ Kế toán/Kho)"**.
3. Bấm vào xem tồn kho thực tế: Giống lúa Bắc Thơm, Phân hữu cơ Quế Lâm, Bao bì gạo 5kg.
4. **Kiểm tra nghiệp vụ chống xuất vượt tồn kho:**
   * Bấm *"📤 - Xuất kho"*.
   * Chọn *Phân hữu cơ Quế Lâm* (tồn 1.200 kg). Thử bấm tăng số lượng lên `1.500 kg`.
   * Bấm *"Xác nhận xuất kho"*: Hệ thống lập tức hiện **Cảnh báo lỗi màu đỏ**: *"Không thể xuất kho! Số lượng yêu cầu xuất vượt quá số lượng tồn kho hiện có"* và trợ lý giọng nói cảnh báo qua loa.

#### C. Trải nghiệm vai trò R02 Ban Quản trị HTX:
1. Trên thanh ghim, chọn **"R02: Ban Quản trị"**.
2. Bấm vào ô **"📊 Bảng điều khiển HTX"**: Màn hình tự động hiển thị **Báo cáo quản trị toàn HTX**:
   * *Tab Thành viên:* Tổng thành viên, số hộ đang hoạt động và biểu đồ phân bố hộ theo địa bàn (Thôn / Xóm).
   * *Tab Sản xuất:* Quy mô sản xuất, số lượng vùng/thửa độc lập (1 cấp), theo dõi quy mô và dự kiến thu hoạch từng thửa.
   * *Tab Bán hàng:* Doanh thu thực thu từ các đơn hàng hoàn thành và giá trị tồn kho.

---

### KỊCH BẢN 8: CHUỖI CUNG ỨNG LINH HOẠT & PHÂN BỔ SẢN LƯỢNG 4 NHÁNH (MỚI) ★

Hệ thống đã nâng cấp phá vỡ luồng tuyến tính cứng nhắc, cho phép phân bổ sản lượng thu hoạch vào 4 nhánh:
- **Nhánh A:** Hộ tự sơ chế / đóng gói $\rightarrow$ Bán trực tiếp cho thương lái / khách lẻ.
- **Nhánh B:** Hộ giao hàng thô cho HTX $\rightarrow$ HTX kiểm nhận, cân đối soát $\rightarrow$ Sơ chế / đóng gói $\rightarrow$ HTX bán.
- **Nhánh C:** Hộ đã đóng gói $\rightarrow$ Giao cho HTX $\rightarrow$ HTX bán nguyên bao gói hoặc đóng gói lại.
- **Nhánh D:** Hàng tồn trữ tại hộ hoặc kho HTX chờ xuất bán.

#### 1. Thao tác Phân bổ Sản lượng Lô 1.000 kg Nhãn lồng (`h-04`):
1. Đăng nhập hoặc chuyển vai trò **R06 - Hộ nông dân** (`Bác Phạm Thị Mai - HTX Quyết Thắng`).
2. Vào **Thu hoạch** $\rightarrow$ Chọn lô nhãn `h-04` (Sản lượng thu hoạch: 1.000 kg).
3. Quan sát **Thẻ Phân bổ Sản lượng**:
   - **Bán trực tiếp:** Đã ghi nhận 200 kg.
   - **Giao HTX:** Đã bàn giao 750 kg (gồm 600 kg hàng thô + 150 kg đóng thùng 10kg).
   - **Tồn khả dụng tại hộ:** Còn 50 kg (có thể tiếp tục bán, đóng gói hoặc giao thêm).
4. Thử các nút hành động hiện trường:
   - **"🛒 Bán trực tiếp"**: Mở màn hình tạo đơn bán hàng, bên bán tự động là Hộ dân, hệ thống kiểm tra tồn khả dụng (tối đa 50 kg).
   - **"🤝 Giao cho HTX"**: Mở biểu mẫu phiếu giao, chọn mua đứt hoặc ký gửi, nhập số lượng và giá thỏa thuận. Phiếu chờ chỉ giữ chỗ lượng, chưa tính là HTX đã nhận.
   - **"⚙️ Sơ chế mẻ mới"**: Mở modal sơ chế tại chỗ, chọn phương pháp (Xay xát / Phân loại / Sấy khô / Sơ chế làm sạch), tính tỷ lệ thu hồi và ghi hao hụt.
   - **"📦 Đóng gói & QR"**: Hộ tự đóng gói lô của mình, tạo tem QR trực tiếp.

#### 2. Đối soát Cân nhận Hàng tại HTX (Vai trò R04 Thủ kho / Kế toán):
1. Chuyển sang vai trò **R04 - Kế toán/Kho** hoặc **R02 - Quản lý HTX** (`HTX Quyết Thắng`).
2. Từ Trang chủ chạm **"Chờ nhận"** để mở **Phiếu giao HTX** theo nhóm chờ; chạm phiếu để xem chi tiết và kiểm nhận.
3. Thử tạo phiếu ký gửi 300 kg từ lô `TH-AN-2026-003` bằng tài khoản R06 An Ninh:
   - Lô thu hoạch 1.500 kg; 1.000 kg đã được HTX mua đứt, 300 kg đang chờ, hộ còn 200 kg khả dụng.
   - HTX kiểm nhận 280 kg $\rightarrow$ chênh lệch `-20 kg`; 20 kg chưa nhận trở lại phần khả dụng của hộ.
   - Nhập đánh giá chất lượng (Đạt loại A/B) và ký xác nhận.
   - Hàng ký gửi sau kiểm nhận vẫn thuộc hộ; HTX chỉ giữ và bán hộ. Thử từ chối phiếu khác để thấy lượng giữ chỗ được giải phóng.

#### 3. HTX Sơ chế và Chống Âm Tồn Kho:
- HTX tiến hành sơ chế 600 kg nhãn thô $\rightarrow$ Đầu ra thu được 540 kg nhãn loại 1 xuất khẩu, ghi nhận hao hụt 60 kg (tỷ lệ thu hồi 90%).
- Hệ thống ghi mẻ 600 kg nhãn thô thành 540 kg sau sơ chế. Fixture đã bán rời 200 kg và đóng hộp 100 kg; còn 240 kg ở trạng thái sau sơ chế.
- Khi tạo đơn bán hàng của HTX, hệ thống kiểm tra tồn kho theo từng trạng thái hàng (thô, sơ chế, đóng gói). Không cho bán vượt tồn.
- Khi đơn hàng bị **Hủy**, hệ thống tự động hoàn trả số lượng hàng về tồn kho tương ứng.

#### 4. Nông sản Tươi sống & Bán Sống (Gà Đông Tảo, Cá lồng Sông Luộc):
- Khi đóng gói hoặc xuất bán gà/cá bán sống: Đánh dấu tùy chọn **"Hàng tươi sống / Bán sống (không đóng gói bao bì cố định)"**.
- Hệ thống không ép buộc nhập quy cách gói cố định, hạn sử dụng hay cấu trúc đóng gói cứng nhắc.
- Đơn vị tính kiểm tra chuẩn theo loại hình sản xuất: số con (gà), thể tích m³ (lồng cá sông Luộc), diện tích m²/sào (thửa lúa, vườn nhãn).

#### 5. Đề nghị Điều chỉnh Nhật ký đã Khóa sau 24 Giờ (Audit Trail VietGAP):
1. Chuyển sang vai trò **R06 - Hộ nông dân**.
2. Mở một bản ghi nhật ký đã tạo quá 24 giờ $\rightarrow$ Nút sửa trực tiếp bị khóa để đảm bảo tính toàn vẹn dữ liệu.
3. Bấm **"📝 Gửi đề nghị điều chỉnh nhật ký"** $\rightarrow$ Nhập lý do (ví dụ: *"Bổ sung liều lượng vôi bột khử khuẩn chuồng"*).
4. Chuyển sang vai trò **R02 - Quản trị HTX** $\rightarrow$ Mở nhật ký đó $\rightarrow$ Duyệt hoặc Từ chối đề nghị điều chỉnh.
5. Bản ghi lưu đầy đủ lịch sử thay đổi (Audit Trail): ai sửa, ngày giờ, lý do và người phê duyệt theo đúng tiêu chuẩn VietGAP.

#### 6. Quét Mã QR Mẻ Gom Lô & Bảo vệ Thông tin Riêng tư:
1. Vào **Quét mã xem nguồn gốc** $\rightarrow$ Quét sản phẩm được gom từ nhiều hộ xã viên.
2. Trang thông tin công khai hiển thị chi tiết: tỷ lệ đóng góp của từng hộ xã viên vào mẻ sản phẩm.
3. Số điện thoại cá nhân của hộ nông dân được che bảo mật (`0988***234`) tránh bị lộ lọt.
4. Thời hạn chứng nhận VietGAP được kiểm tra thực tế theo ngày đóng gói.

### KỊCH BẢN 9: ĐIỀU PHỐI TRƯỚC THU HOẠCH, QR KHÔNG ĐÓNG GÓI, ĐỐI SOÁT CHÊNH LỆCH & SAU BÁN HÀNG (MỚI BỔ SUNG) ★★★

Kịch bản này hoàn thiện trọn vẹn chuỗi giá trị nông sản Hưng Yên từ lập kế hoạch trước thu hoạch đến chăm sóc khách hàng sau bán hàng:

#### 1. Nhắc việc theo vụ/lứa và ghi nhật ký:
1. **Truy cập:** Màn **"Công việc"** riêng được bỏ cho mọi vai trò trong Mini App. Vai trò có quyền xem nhật ký dùng mục **"Nhật ký sản xuất"**; hộ dân thấy việc dự kiến đến hạn trong **Thông báo** và có thể mở thẳng biểu mẫu nhật ký từ lời nhắc.
2. **HTX An Ninh (Lúa sạch):** Với vùng và vụ lúa phù hợp, biểu mẫu gợi ý việc chăm sóc hoặc thu hoạch gần ngày dự kiến. Hộ chỉ ghi sau khi thực hiện, kèm kết quả thực tế và ảnh nếu có.
3. **HTX Đông Tảo (Gà đặc sản):** Việc theo lứa nuôi như tiêm phòng được nhắc cho đúng hộ và gợi ý khi ghi nhật ký; người dùng vẫn có thể tự chọn loại việc khác.
4. **HTX Quyết Thắng (Cá lồng & Vườn nhãn):** Nhật ký ghi việc đã làm cho đúng đơn vị sản xuất và vụ/lứa. Lịch dự kiến chỉ hỗ trợ nhắc và gợi ý, không thay thế dữ liệu thực tế do hộ xác nhận.

#### 2. Giao nhận & Đối soát chênh lệch cân đo:
1. Vào **Thu hoạch** $\rightarrow$ Chọn lô thu hoạch (ví dụ: `TH-AN-2026-001` thóc tươi Bắc Thơm).
2. Quan sát mục **"Biên bản Giao nhận & Đối soát chênh lệch"**:
   - Phiếu mẫu `GN-AN-2026-009` lấy từ lô `TH-AN-2026-001` có sản lượng 1.200 kg: hộ khai 1.200 kg, HTX thực nhận đủ 1.200 kg. Chênh lệch cân thiếu được thử bằng phiếu 300 kg mới ở kịch bản trên.
   - **Gửi ý kiến giải trình:** Nếu cân thiếu, hộ mở phiếu đã kiểm nhận và ghi lý do trong mục đối soát.
   - **Chốt đối soát (Vai trò R04/R02):** Kế toán bấm **"✓ Chốt đối soát khớp số liệu"**.
   - **Minh bạch tài chính:** Phiếu mua đứt `GN-AN-2026-009` có đơn giá 10.500 đ/kg, tổng tiền 12.600.000 đ, tạm ứng 10.000.000 đ. Phiếu ký gửi không tự tạo khoản phải trả do HTX mua hàng.

#### 3. QR Độc lập với Đóng gói (Bán tươi sống, Bán xá nguyên trạng):
1. **Xem/In QR Lô bán sống:**
   - Vào chi tiết Lô gà sống (`TH-DT-2026-001`) hoặc Lô cá lăng sống (`TH-QT-2026-003B`) $\rightarrow$ Bấm **"🏷️ Xem / In mã QR Lô bán sống (Không đóng gói)"**.
   - Pop-up hiển thị mã QR truy xuất độc lập kèm nút in tem Bluetooth hoặc xem trang truy xuất.
2. **Xem/In QR Phiếu xuất / Đơn bán hàng:**
   - Vào **Bán hàng** $\rightarrow$ Mở đơn bán gà sống `DH-DT-2026-015` $\rightarrow$ Bấm **"🏷️ Mã QR phiếu xuất"**.
3. **Quét xác thực nguồn gốc không dựng đóng gói giả:**
   - Dùng camera quét mã QR của Lô hoặc Phiếu xuất nói trên.
   - Trang truy xuất hiển thị chuẩn xác: **"Bán nông sản tươi sống / Hàng xá nguyên trạng"**, trỏ thẳng về hộ nuôi, cơ sở sản xuất, chu kỳ và nhật ký VietGAP mà **hoàn toàn không dựng công đoạn đóng gói giả**.
   - Số điện thoại chủ hộ được che bảo mật (`0988***234`).
4. **HTX bán nguyên trạng hàng hộ đã đóng gói:**
   - Đối với thùng nhãn hộ tự đóng gói (`QR-QT-NHAN-005`), khi HTX xuất bán, mã QR vẫn truy nguyên về lô gốc `h-04` và hộ bác Mai, không bắt buộc phải đóng gói lại.

#### 4. Sau bán hàng: Giao hàng thực tế, Công nợ & Phản hồi chất lượng:
1. **Giao hàng thực tế & Kiểm soát tồn lô:**
   - Mở chi tiết đơn hàng (ví dụ: `DH-AN-2026-009`) $\rightarrow$ Bấm **"🚚 Cập nhật lần giao thực tế"**.
   - Nhập số lượng giao thực tế, biển số xe, người nhận. Hệ thống kiểm tra đối chiếu không cho phép giao vượt quá số lượng đơn hoặc tồn lô.
   - Thẻ đơn hàng cập nhật tiến độ: *Chưa giao $\rightarrow$ Đang giao $\rightarrow$ Đã giao thành công*.
2. **Đối soát công nợ đơn hàng:**
   - Thẻ tài chính hiển thị rõ ràng: Tổng giá trị, Đã thanh toán, và **Còn nợ cần thu** (tô màu cam nổi bật).
3. **Phản hồi chất lượng khách hàng:**
   - Vào ô **"💬 Phản hồi chất lượng"** tại Trang chủ để xem ý kiến của đối tác, siêu thị, thương lái (WinMart, nhà hàng, đại lý).
   - Người phụ trách có thể bấm **"Xử lý phản hồi"** để ghi nhận giải pháp xử lý kỹ thuật hoặc đổi trả.
4. **Báo cáo tóm tắt hiện trường thời gian thực:**
   - Đầu trang chủ tích hợp widget **"Tóm tắt hiện trường (Thời gian thực)"** hiển thị: việc trễ hạn, việc hôm nay, lô chờ kiểm nhận, đơn chờ giao, phản hồi khách hàng chưa xử lý. Toàn bộ số liệu tính toán trực tiếp từ dữ liệu giao dịch thật của HTX.

---

## IV. BẢO TRÌ VÀ MỞ RỘNG MÃ NGUỒN

* **Cấu trúc thư mục:**
  * `src/context/AppContext.tsx`: Quản lý toàn bộ State, cơ chế xác thực, phân quyền 4 vai trò, điều hướng và dữ liệu CRUD chuỗi cung ứng linh hoạt.
  * `src/mock/data.ts`: Bộ dữ liệu mẫu chi tiết cho 3 HTX Hưng Yên (tiêu chí chất lượng động, lô thu hoạch, giao nhận, tồn kho 2 cấp, lịch sử sơ chế).
  * `src/utils/permissions.ts`: Phân quyền chi tiết cho R06, R03, R04, R02 theo phạm vi sở hữu lô và HTX.
  * `src/components/`: Header, BottomNav, ProductHandoverModal, HarvestProcessingModal, CounterInput, VoiceModal, RoleHTXSwitcher.
  * `src/pages/`: Toàn bộ các trang nghiệp vụ: Auth, Home, Diary, Farm, Harvest, Packaging, Sales, Trace, Members, Inventory, Dashboard, Tasks, Feedback.
* **Bộ kiểm thử tự động (Unit / Integration Tests):**
  * File test: `src/test/businessWorkflow.test.ts`
  * Chạy test: `npx tsx src/test/businessWorkflow.test.ts` (33/33 tests PASS trong 11 suites).
* **Kiểm tra tính đúng đắn mã nguồn:** Chạy `npx tsc --noEmit` và `npm run build` để đảm bảo 100% type-safe và đóng gói production thành công.


