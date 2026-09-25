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
| **HTX Dịch vụ Nông nghiệp An Ninh** | Tiền Lữ | Lúa sạch VietGAP (Bắc Thơm 7, ST25) | Bác Nguyễn Văn An (62 tuổi) |
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
3. **Cảnh báo nhật ký hôm nay (CN-3.5.4):** Nếu hôm nay chưa ghi nhật ký, Trang chủ xuất hiện banner màu cam nhấp nháy: *"Hôm nay bác chưa ghi nhật ký!"* kèm nút *"Ghi ngay ➜"*.
4. **Lưới chức năng ô lớn:** Bố cục dạng thẻ card lớn vuông vức, chạm mở nhanh từng phần.

---

### KỊCH BẢN 3: SỔ NHẬT KÝ ĐỒNG RUỘNG (CN-3.5.1 – CN-3.5.6) ★ ƯU TIÊN 1
1. **Xem danh sách timeline:** Từ Trang chủ, chạm ô **"📖 Sổ nhật ký đồng ruộng"**. Các công việc được sắp xếp theo ngày kèm icon trực quan (💧 Tưới nước, 🌱 Bón phân, 🌿 Làm cỏ).
2. **Luồng 4 bước thêm nhật ký mới (CN-3.5.2):** Bấm nút **"➕ Ghi mới"**:
   * *Bước 1 (Chọn ngày & Vùng):* Bác nông dân chọn nhanh nút *"📅 Hôm nay"* hoặc *"📅 Hôm qua"*, chọn thửa ruộng từ danh sách. Bấm *"Tiếp tục: Bước 2"*.
   * *Bước 2 (Chọn nhiều công việc cùng lúc):* Bác nông dân có thể chạm chọn **cùng lúc nhiều việc đã làm** trong buổi ra đồng (ví dụ: vừa chạm *Tưới nước 💧* vừa chạm *Bón phân 🌱*). Thẻ được chọn sẽ có viền xanh đậm và dấu tick `✓ Đã chọn`. Nhập tên vật tư chung (nếu có). Bấm *"Sang Bước 3"*.
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

## IV. BẢO TRÌ VÀ MỞ RỘNG MÃ NGUỒN

* **Cấu trúc thư mục:**
  * `src/context/AppContext.tsx`: Quản lý toàn bộ State, cơ chế xác thực, chuyển vai trò, điều hướng và dữ liệu CRUD.
  * `src/mock/data.ts`: Bộ dữ liệu mẫu chi tiết cho 3 HTX Hưng Yên.
  * `src/components/`: Header có nút Back/Voice, BottomNav Zalo, CounterInput +/-, VoiceModal, RoleHTXSwitcher.
  * `src/pages/`: Toàn bộ các trang nghiệp vụ từ Auth, Home, Diary, Farm, Harvest, Packaging, Sales, Trace, Members, Inventory đến Dashboard.
* **Kiểm tra tính đúng đắn mã nguồn:** Chạy `npx tsc --noEmit` để đảm bảo 100% type-safe, không có bất kỳ cảnh báo hoặc lỗi cú pháp nào.
