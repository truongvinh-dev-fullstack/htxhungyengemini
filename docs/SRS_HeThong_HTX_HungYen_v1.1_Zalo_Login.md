# TÀI LIỆU ĐẶC TẢ YÊU CẦU PHẦN MỀM (SRS)
## Hệ thống "Cơ sở dữ liệu thông tin sản xuất phục vụ quản trị HTX và truy xuất nguồn gốc"
### Thí điểm tại 03 Hợp tác xã nông nghiệp tỉnh Hưng Yên

| Thông tin | Nội dung |
|---|---|
| Tên dự án | Xây dựng CSDL thông tin sản xuất phục vụ quản trị HTX và truy xuất nguồn gốc |
| Phạm vi thí điểm | 03 HTX: An Ninh (lúa), Đông Tảo (gà), Quyết Thắng (nhãn & thủy sản) |
| Nền tảng | Web App (Angular + .NET Core) + Zalo Mini App |
| Phiên bản tài liệu | 1.1 – Draft |
| Loại tài liệu | Software Requirements Specification (SRS) |

---

## MỤC LỤC

1. Giới thiệu chung
2. Mô tả tổng quan hệ thống
3. Danh sách tác nhân (Actor) và vai trò
4. Yêu cầu chức năng chi tiết — Module 1: Quản trị hệ thống
5. Yêu cầu chức năng chi tiết — Module 2: CSDL sản xuất & quản trị HTX (Web)
6. Yêu cầu chức năng chi tiết — Module 3: Zalo Mini App
7. Ma trận phân quyền chức năng theo vai trò
8. Mô hình dữ liệu (Data Dictionary) chính
9. Yêu cầu phi chức năng
10. Yêu cầu giao diện người dùng (UI/UX)
11. Ràng buộc, giả định và phụ thuộc
12. Phụ lục: Bảng tổng hợp toàn bộ chức năng

---

## 1. GIỚI THIỆU CHUNG

### 1.1 Mục đích tài liệu
Tài liệu này đặc tả chi tiết các yêu cầu chức năng và phi chức năng của phần mềm phục vụ quản trị sản xuất, quản trị Hợp tác xã (HTX) và truy xuất nguồn gốc sản phẩm nông nghiệp, làm cơ sở cho việc thiết kế, lập trình, kiểm thử, nghiệm thu và đào tạo sử dụng trong khuôn khổ nhiệm vụ khoa học công nghệ "Thí điểm mô hình HTX ứng dụng chuyển đổi số trên địa bàn tỉnh Hưng Yên".

### 1.2 Phạm vi hệ thống
Hệ thống gồm 3 thành phần chính, dùng chung một CSDL tập trung trên nền tảng cloud:

- **Web Admin/Portal** (Angular + .NET Core API): dành cho Quản trị viên hệ thống, Ban quản trị HTX, cán bộ kỹ thuật, kế toán/bán hàng — quản trị toàn diện dữ liệu sản xuất, thành viên, kho, bán hàng, báo cáo.
- **Zalo Mini App**: dành cho thành viên/hộ nông dân trực tiếp sản xuất — ghi nhận nhật ký, thu hoạch, đóng gói, bán hàng, tra cứu, nhận thông báo, với UI tối giản phù hợp người lớn tuổi.
- **Trang truy xuất nguồn gốc công khai** (không cần đăng nhập): người tiêu dùng quét mã QR trên sản phẩm để xem thông tin nguồn gốc.

Phạm vi thí điểm áp dụng cho 03 mô hình HTX đại diện 03 nhóm sản phẩm chủ lực của tỉnh Hưng Yên:

| HTX | Địa bàn | Sản phẩm chủ lực | Đặc thù dữ liệu |
|---|---|---|---|
| HTX dịch vụ nông nghiệp An Ninh | Xã An Ninh | Lúa sạch | Quản lý theo vùng trồng, mùa vụ lúa (Xuân/Mùa) |
| HTX chăn nuôi và kinh doanh gà Đông Tảo | Khoái Châu | Gà Đông Tảo | Quản lý theo đàn/lứa nuôi, quy trình chăn nuôi |
| HTX cây ăn quả đặc sản và NTTS Quyết Thắng | Xã Tân Hưng | Nhãn lồng, thủy sản | Quản lý theo vườn cây lâu năm + ao nuôi trồng thủy sản |

Hệ thống phải hỗ trợ cấu hình danh mục (giống cây/con, quy trình, đơn vị tính...) linh hoạt để dùng chung được cho cả 3 loại hình sản xuất (trồng trọt, chăn nuôi, thủy sản) mà không cần sửa code khi mở rộng sang HTX khác sau thí điểm.

### 1.3 Đối tượng sử dụng tài liệu
Đội ngũ phân tích nghiệp vụ, thiết kế hệ thống, lập trình viên, kiểm thử viên (QA), Ban quản trị HTX và Sở NN&PTNT Hưng Yên (đơn vị phối hợp/nghiệm thu).

### 1.4 Định nghĩa, từ viết tắt

| Từ viết tắt | Giải nghĩa |
|---|---|
| HTX | Hợp tác xã |
| SRS | Software Requirements Specification |
| CRUD | Create – Read – Update – Delete (Thêm – Xem – Sửa – Xóa) |
| QR | Quick Response Code – mã phản hồi nhanh |
| Zalo Mini App | Ứng dụng chạy trên nền tảng Zalo, không cần cài đặt riêng |
| Master Data | Dữ liệu danh mục dùng chung toàn hệ thống |
| CTV | Cộng tác viên |
| OCOP | Chương trình Mỗi xã một sản phẩm |

### 1.5 Tài liệu tham khảo
- Nội dung 4 & Nội dung 5 – Thuyết minh nhiệm vụ KH&CN "Thí điểm mô hình HTX ứng dụng chuyển đổi số tỉnh Hưng Yên"
- Bảng tổng hợp chức năng phần mềm (file Excel danh sách 174 hạng mục chức năng)
- Bảng chức năng theo từng HTX thí điểm (An Ninh / Đông Tảo / Quyết Thắng)

---

## 2. MÔ TẢ TỔNG QUAN HỆ THỐNG

### 2.1 Kiến trúc tổng thể

```
                    ┌───────────────────────┐
                    │   CSDL tập trung       │
                    │ (SQL Server/PostgreSQL)│
                    └──────────┬────────────┘
                               │
                     ┌─────────┴──────────┐
                     │   .NET Core API    │
                     │ (RESTful, phân     │
                     │  quyền theo vai trò,│
                     │  cấu hình riêng    │
                     │  theo từng HTX)     │
                     └───┬─────────────┬──┘
                         │             │
              ┌──────────┘             └───────────┐
     ┌────────▼─────────┐                 ┌─────────▼────────┐
     │ Web Admin/Portal  │                 │  Zalo Mini App    │
     │  (Angular)        │                 │  (zmp-ui/React)   │
     └────────────────────┘                 └────────────────────┘
                         │                             │
                         └─────────────┬───────────────┘
                                       │
                          ┌────────────▼─────────────┐
                          │ Trang truy xuất nguồn gốc │
                          │  công khai (quét mã QR)    │
                          └────────────────────────────┘
```

### 2.2 Nguyên tắc thiết kế hệ thống
- **Multi-tenant theo HTX**: mỗi HTX có dữ liệu tách biệt (thành viên, vùng sản xuất, kho, đơn hàng...) nhưng dùng chung 1 hệ thống, 1 CSDL, cấu hình danh mục riêng theo từng HTX.
- **Phân quyền theo vai trò (Role-Based Access Control – RBAC)**: mỗi tài khoản gắn với 1 hoặc nhiều vai trò, mỗi vai trò được cấu hình quyền truy cập tới từng chức năng (xem/thêm/sửa/xóa/duyệt).
- **Truy vết dữ liệu (Audit log)**: các thao tác thêm/sửa/xóa trên dữ liệu nghiệp vụ quan trọng (nhật ký sản xuất, thành viên, đơn hàng) phải được ghi log người thực hiện, thời gian, nội dung thay đổi.
- **Đồng bộ dữ liệu 2 chiều** giữa Web Admin và Zalo Mini App qua cùng một bộ API — dữ liệu nhập từ Mini App (nhật ký, thu hoạch...) phải hiển thị ngay trên Web Admin và ngược lại.
- **Thiết kế ưu tiên người dùng lớn tuổi**: chi tiết tại Mục 10.

### 2.3 Danh sách module hệ thống

| Mã Module | Tên Module | Nền tảng |
|---|---|---|
| M1 | Quản trị hệ thống | Web |
| M2 | CSDL sản xuất & Quản trị HTX | Web |
| M3 | Ứng dụng Zalo Mini App | Zalo Mini App |

---

## 3. DANH SÁCH TÁC NHÂN (ACTOR) VÀ VAI TRÒ

| Mã vai trò | Tên vai trò | Nền tảng sử dụng | Mô tả |
|---|---|---|---|
| R01 | Quản trị viên hệ thống (Admin) | Web | Quản trị toàn hệ thống, phân quyền, cấu hình tham số, danh mục dùng chung, xem dữ liệu toàn bộ 3 HTX |
| R02 | Ban quản trị HTX (Giám đốc/Chủ tịch) | Web + Zalo Mini App | Xem dashboard, báo cáo, phê duyệt thành viên, phê duyệt dữ liệu quan trọng của HTX mình |
| R03 | Cán bộ kỹ thuật HTX | Web + Zalo Mini App | Quản lý vùng sản xuất, quy trình, nhật ký, thu hoạch, sơ chế |
| R04 | Kế toán/Bán hàng HTX | Web + Zalo Mini App | Quản lý kho, đơn hàng, hóa đơn, báo cáo doanh thu |
| R05 | Tổ trưởng sản xuất | Zalo Mini App (+ Web hạn chế) | Quản lý thành viên tổ, phê duyệt/hỗ trợ ghi nhật ký hộ thành viên |
| R06 | Thành viên/Hộ nông dân | Zalo Mini App | Ghi nhật ký, thu hoạch, đóng gói, bán hàng của hộ mình, tra cứu thông tin |
| R07 | Người tiêu dùng (khách vãng lai) | Trang công khai | Quét mã QR xem thông tin truy xuất nguồn gốc, không cần tài khoản |

---

## 4. YÊU CẦU CHỨC NĂNG CHI TIẾT — MODULE 1: QUẢN TRỊ HỆ THỐNG

> Áp dụng chung nguyên tắc CRUD sau cho toàn bộ các nhóm chức năng "Danh sách/Thêm/Sửa/Xóa" trong tài liệu này, trừ khi có quy định khác:
> - **Thêm mới**: hiển thị form nhập liệu, validate bắt buộc/định dạng trước khi lưu, hiển thị thông báo thành công/lỗi.
> - **Sửa**: nạp sẵn dữ liệu hiện có vào form, validate như thêm mới, ghi log thay đổi.
> - **Xóa**: yêu cầu xác nhận bằng hộp thoại; nếu bản ghi đã phát sinh liên kết nghiệp vụ (VD: thành viên đã có nhật ký, vật tư đã có phiếu nhập/xuất) thì **không cho xóa cứng**, chuyển sang **vô hiệu hóa (Inactive/Ẩn)** và cảnh báo rõ lý do.
> - **Tìm kiếm/Lọc**: hỗ trợ tìm theo từ khóa (tên/mã) + lọc theo trạng thái, theo HTX (nếu là Admin xem toàn hệ thống).
> - **Phân trang**: danh sách hiển thị phân trang, mặc định 20 bản ghi/trang.

### 4.1 Chức năng CN-1.1: Người dùng và bảo mật

> Nhóm chức năng này áp dụng cho **Web Admin/Portal**. Cơ chế xác thực trên **Zalo Mini App** được đặc tả riêng tại Mục 6.1 và không sử dụng tài khoản/mật khẩu.

| Mã CN | Tên chức năng | Vai trò | Mô tả chi tiết | Input | Output | Quy tắc nghiệp vụ |
|---|---|---|---|---|---|---|
| CN-1.1.1 | Đăng nhập hệ thống | Tất cả | Xác thực tài khoản bằng username/số điện thoại + mật khẩu | Tên đăng nhập, mật khẩu | Token phiên đăng nhập, chuyển vào trang chủ theo vai trò | Sai quá 5 lần → khóa tạm 15 phút; mật khẩu mã hóa (hash + salt) |
| CN-1.1.2 | Đổi mật khẩu | Tất cả | Người dùng tự đổi mật khẩu khi đã đăng nhập | Mật khẩu cũ, mật khẩu mới, xác nhận mật khẩu mới | Thông báo đổi thành công, buộc đăng nhập lại | Mật khẩu mới tối thiểu 8 ký tự, khác mật khẩu cũ |
| CN-1.1.3 | Quên mật khẩu | Tất cả | Lấy lại mật khẩu qua OTP SMS/Zalo hoặc email | Số điện thoại/email đăng ký | Mã OTP xác thực, form đặt mật khẩu mới | OTP hết hạn sau 5 phút, tối đa 3 lần nhập sai |

### 4.2 Chức năng CN-1.2: Quản lý nhóm quyền

| Mã CN | Tên chức năng | Vai trò | Mô tả chi tiết | Input | Output | Quy tắc nghiệp vụ |
|---|---|---|---|---|---|---|
| CN-1.2.1 | Tìm kiếm nhóm quyền | R01 | Tìm theo tên nhóm quyền | Từ khóa | Danh sách nhóm quyền phù hợp | — |
| CN-1.2.2 | Thêm mới nhóm quyền | R01 | Tạo nhóm quyền mới, gán danh sách chức năng được phép (dạng cây checkbox theo module) | Tên nhóm quyền, mô tả, danh sách quyền chi tiết theo từng chức năng (Xem/Thêm/Sửa/Xóa/Duyệt/Xuất) | Nhóm quyền mới | Tên nhóm quyền không trùng |
| CN-1.2.3 | Chỉnh sửa nhóm quyền | R01 | Cập nhật tên, mô tả, danh sách quyền của nhóm | ID nhóm quyền, dữ liệu cập nhật | Nhóm quyền sau cập nhật | Không được sửa nhóm quyền hệ thống mặc định (Super Admin) |
| CN-1.2.4 | Xóa nhóm quyền | R01 | Xóa nhóm quyền không còn sử dụng | ID nhóm quyền | Xác nhận đã xóa | Không cho xóa nếu đang có tài khoản gán nhóm quyền này |

### 4.3 Chức năng CN-1.4: Cấu hình tham số hệ thống

| Mã CN | Tên chức năng | Vai trò | Mô tả chi tiết | Input | Output | Quy tắc nghiệp vụ |
|---|---|---|---|---|---|---|
| CN-1.4.1 | Cấu hình tham số chung | R01 | Cấu hình các tham số vận hành: thời gian OTP hết hạn, số lần nhập sai tối đa, định dạng mã sản phẩm/QR, logo mặc định, tần suất nhắc nhật ký... | Danh sách tham số + giá trị | Lưu cấu hình, áp dụng toàn hệ thống | Một số tham số yêu cầu khởi động lại dịch vụ mới áp dụng (ghi chú rõ trên UI) |

### 4.4 Chức năng CN-1.5: Quản lý danh mục dữ liệu dùng chung (Master Data)

| Mã CN | Tên chức năng | Vai trò | Mô tả chi tiết | Input | Output | Quy tắc nghiệp vụ |
|---|---|---|---|---|---|---|
| CN-1.5.1 | Tìm kiếm danh mục | R01 | Tìm kiếm trong các nhóm danh mục dùng chung: đơn vị tính, loại vật tư, loại cây/con, đơn vị hành chính... | Loại danh mục, từ khóa | Danh sách giá trị danh mục | — |
| CN-1.5.2 | Thêm mới danh mục | R01 | Thêm giá trị mới vào 1 loại danh mục | Loại danh mục, mã, tên, thứ tự hiển thị | Giá trị danh mục mới | Mã không trùng trong cùng 1 loại danh mục |
| CN-1.5.3 | Chỉnh sửa danh mục | R01 | Sửa tên/mô tả/thứ tự của giá trị danh mục | ID danh mục, dữ liệu cập nhật | Giá trị sau cập nhật | Không sửa được mã hệ thống dùng làm khóa tham chiếu |
| CN-1.5.4 | Xóa danh mục | R01 | Xóa giá trị danh mục không dùng | ID danh mục | Xác nhận đã xóa | Không cho xóa nếu đang được tham chiếu ở dữ liệu khác (chuyển ẩn) |

### 4.5 Chức năng CN-1.6: Quản lý file thông tin kỹ thuật nông nghiệp

| Mã CN | Tên chức năng | Vai trò | Mô tả chi tiết | Input | Output | Quy tắc nghiệp vụ |
|---|---|---|---|---|---|---|
| CN-1.6.1 | Danh sách thông tin kỹ thuật | R01, R03 | Xem thư viện tài liệu kỹ thuật canh tác/chăn nuôi/nuôi trồng (hướng dẫn, video, quy trình mẫu) theo loại cây/con | Bộ lọc theo loại cây/con | Danh sách tài liệu | Tài liệu có thể hiển thị công khai tới Zalo Mini App cho thành viên tham khảo |
| CN-1.6.2 | Thêm/sửa/xóa thông tin kỹ thuật | R01 | Quản lý nội dung, file đính kèm (PDF/ảnh/video), gắn với loại cây/con áp dụng | Tiêu đề, nội dung, file đính kèm, loại cây/con áp dụng | Tài liệu được lưu | Giới hạn dung lượng file tải lên (cấu hình tại CN-1.4) |

### 4.6 Chức năng CN-1.7: Quản lý thông báo

| Mã CN | Tên chức năng | Vai trò | Mô tả chi tiết | Input | Output | Quy tắc nghiệp vụ |
|---|---|---|---|---|---|---|
| CN-1.7.1 | Xem danh sách thông báo | Tất cả | Xem lịch sử thông báo đã gửi/nhận | Bộ lọc theo thời gian, loại thông báo | Danh sách thông báo | — |
| CN-1.7.2 | Thêm/sửa/xóa thông báo | R01, R02 | Soạn thông báo (tiêu đề, nội dung, đối tượng nhận: toàn hệ thống/theo HTX/theo vai trò/theo thành viên cụ thể) | Nội dung thông báo, đối tượng nhận, thời gian gửi (ngay/hẹn giờ) | Thông báo được lưu ở trạng thái nháp | — |
| CN-1.7.3 | Gửi thông báo | R01, R02 | Gửi thông báo đã soạn tới đối tượng đã chọn, đẩy qua kênh Zalo Mini App (push notification) | ID thông báo | Trạng thái gửi thành công/thất bại theo từng người nhận | Ghi log thời gian gửi và số người đã đọc |

---

## 5. YÊU CẦU CHỨC NĂNG CHI TIẾT — MODULE 2: CSDL SẢN XUẤT & QUẢN TRỊ HTX (WEB)

### 5.1 Nhóm CN-2.1: Quản lý cơ sở dữ liệu liên quan HTX

| Mã CN | Tên chức năng | Vai trò | Mô tả chi tiết | Input | Output | Quy tắc nghiệp vụ |
|---|---|---|---|---|---|---|
| CN-2.1.1 | Xem thông tin chung HTX | R01, R02, R03, R04 | Hiển thị hồ sơ HTX: tên, mã số, địa chỉ, người đại diện, ngành nghề, logo, năm thành lập | — | Thông tin HTX | — |
| CN-2.1.2 | Chỉnh sửa thông tin chung HTX | R02 | Cập nhật hồ sơ HTX | Các trường thông tin HTX, logo (upload ảnh) | Hồ sơ cập nhật | Chỉ Ban quản trị HTX hoặc Admin được sửa |
| CN-2.1.3 | Danh sách giống cây/vật nuôi | R01, R03 | Xem danh mục giống áp dụng riêng theo HTX (VD: giống lúa Bắc Thơm 7 – An Ninh; giống gà Đông Tảo thuần – Đông Tảo; giống nhãn lồng – Quyết Thắng) | Bộ lọc theo HTX, loại (cây/con/thủy sản) | Danh sách giống | — |
| CN-2.1.4 | Thêm/sửa/xóa giống cây/vật nuôi | R03 | Quản lý thông tin giống: tên, đặc tính, thời gian sinh trưởng/thu hoạch dự kiến | Tên giống, loại, mô tả, thời gian sinh trưởng | Giống được lưu | Không xóa nếu giống đang gán cho vùng sản xuất đang hoạt động |
| CN-2.1.5 | Danh sách mùa vụ | R01, R03 | Xem danh sách cấu hình mùa vụ (VD: Vụ Xuân 2026, Vụ Mùa 2026, Lứa nuôi 1/2026) | Bộ lọc theo HTX, năm | Danh sách mùa vụ | — |
| CN-2.1.6 | Thêm/sửa/xóa cấu hình mùa vụ | R03 | Cấu hình tên mùa vụ, thời gian bắt đầu/kết thúc dự kiến, loại cây/con áp dụng | Tên mùa vụ, ngày bắt đầu/kết thúc, loại áp dụng | Mùa vụ được lưu | Ngày kết thúc phải sau ngày bắt đầu |
| CN-2.1.7 | Danh sách đối tác | R01, R03, R04 | Xem danh sách nhà cung cấp vật tư, đơn vị thu mua/liên kết chuỗi | Từ khóa, loại đối tác | Danh sách đối tác | — |
| CN-2.1.8 | Thêm/sửa/xóa đối tác | R04 | Quản lý thông tin đối tác: tên, loại hình, người liên hệ, SĐT, địa chỉ | Thông tin đối tác | Đối tác được lưu | Không xóa nếu đối tác có phiếu nhập kho/hợp đồng liên kết |
| CN-2.1.9 | Danh sách cộng tác viên | R01, R03, R04 | Xem danh sách CTV hỗ trợ thu mua/phân phối | Từ khóa | Danh sách CTV | — |
| CN-2.1.10 | Thêm/sửa/xóa cộng tác viên | R04 | Quản lý thông tin CTV: tên, SĐT, khu vực phụ trách | Thông tin CTV | CTV được lưu | — |
| CN-2.1.11 | Danh sách thương lái/khách hàng | R01, R04 | Xem danh sách khách hàng/thương lái mua sản phẩm | Từ khóa | Danh sách khách hàng | — |
| CN-2.1.12 | Thêm/sửa/xóa thương lái/khách hàng | R04 | Quản lý thông tin khách hàng: tên, SĐT, địa chỉ, loại KH (thương lái/đại lý/lẻ) | Thông tin khách hàng | Khách hàng được lưu | Không xóa nếu đã phát sinh đơn hàng |

### 5.2 Nhóm CN-2.2: Quản lý hồ sơ / tài liệu HTX

| Mã CN | Tên chức năng | Vai trò | Mô tả chi tiết | Input | Output | Quy tắc nghiệp vụ |
|---|---|---|---|---|---|---|
| CN-2.2.1 | Thêm/sửa/xóa danh mục tài liệu | R02 | Quản lý các nhóm phân loại hồ sơ (VD: Hồ sơ OCOP, Giấy chứng nhận, Biểu mẫu nội bộ) | Tên danh mục | Danh mục được lưu | — |
| CN-2.2.2 | Thêm/sửa/xóa tài liệu | R02, R03 | Upload/cập nhật/xóa tài liệu thuộc 1 danh mục (VD: hồ sơ đăng ký OCOP) | File đính kèm, tên tài liệu, danh mục, mô tả | Tài liệu được lưu | Giới hạn định dạng: PDF, DOC, JPG, PNG |
| CN-2.2.3 | Tìm kiếm/tải tài liệu | Tất cả (theo quyền) | Tìm kiếm theo tên/danh mục, tải file về | Từ khóa, danh mục | File tài liệu | Ghi log lượt tải nếu tài liệu thuộc loại bảo mật |

### 5.3 Nhóm CN-2.3: Quản lý thành viên HTX

| Mã CN | Tên chức năng | Vai trò | Mô tả chi tiết | Input | Output | Quy tắc nghiệp vụ |
|---|---|---|---|---|---|---|
| CN-2.3.1 | Danh sách thành viên | R01, R02, R03 | Xem danh sách thành viên theo HTX, kèm trạng thái (Đang hoạt động/Chờ duyệt/Ngừng) | Bộ lọc theo HTX, trạng thái, tổ sản xuất | Danh sách thành viên | — |
| CN-2.3.2 | Thêm/sửa/xóa thành viên | R02, R03 | Quản lý hồ sơ thành viên: họ tên, CCCD, SĐT, địa chỉ, diện tích/quy mô sản xuất, ngày gia nhập | Thông tin thành viên | Thành viên được lưu | Không xóa nếu thành viên có nhật ký/vùng sản xuất/đơn hàng — chuyển "Ngừng hoạt động" |
| CN-2.3.3 | Chi tiết thành viên | Tất cả (theo quyền) | Xem đầy đủ hồ sơ + lịch sử sản xuất, thu hoạch, giao dịch của thành viên | ID thành viên | Trang chi tiết thành viên | — |
| CN-2.3.4 | Xuất Excel danh sách thành viên | R02, R03 | Xuất file Excel toàn bộ/theo bộ lọc hiện tại | Bộ lọc áp dụng | File Excel (.xlsx) | — |
| CN-2.3.5 | Phê duyệt thành viên | R02 | Duyệt/từ chối yêu cầu đăng ký thành viên mới gửi từ Zalo Mini App | ID yêu cầu, quyết định (Duyệt/Từ chối), lý do (nếu từ chối) | Trạng thái thành viên cập nhật, gửi thông báo kết quả tới người đăng ký | Thành viên chỉ dùng được đầy đủ chức năng sau khi được duyệt |

### 5.4 Nhóm CN-2.4: Quản lý vùng trồng/chăn nuôi

| Mã CN | Tên chức năng | Vai trò | Mô tả chi tiết | Input | Output | Quy tắc nghiệp vụ |
|---|---|---|---|---|---|---|
| CN-2.4.1 | Danh sách vùng sản xuất | R01, R02, R03 | Xem danh sách vùng trồng/chuồng trại/ao nuôi theo HTX, theo thành viên phụ trách | Bộ lọc HTX, thành viên, loại hình | Danh sách vùng sản xuất | — |
| CN-2.4.2 | Thêm/sửa/xóa vùng sản xuất | R03 | Quản lý thông tin vùng: tên, diện tích/quy mô, thành viên phụ trách, giống cây/con hiện tại, mùa vụ áp dụng, tọa độ (nếu có) | Tên vùng, diện tích, giống, mùa vụ, thành viên phụ trách | Vùng sản xuất được lưu | Không xóa nếu vùng đã có nhật ký/thu hoạch — chuyển ẩn |
| CN-2.4.3 | Chi tiết vùng sản xuất | Tất cả (theo quyền) | Xem đầy đủ thông tin vùng + lịch sử canh tác/chăn nuôi qua các mùa vụ | ID vùng | Trang chi tiết vùng | — |
| CN-2.4.4 | Dự báo sản lượng theo vùng trồng/nuôi | R01, R02, R03 | Ước tính sản lượng dự kiến dựa trên diện tích, giống, giai đoạn sinh trưởng hiện tại và dữ liệu lịch sử | ID vùng hoặc toàn HTX | Sản lượng dự kiến, thời gian dự kiến thu hoạch (biểu đồ + số liệu) | Công thức ước tính cấu hình được theo từng loại cây/con (tham số tại CN-1.4/CN-1.5) |

### 5.5 Nhóm CN-2.5: Quản lý sản xuất

**a) Quản lý cấu hình quy trình gieo trồng/chăn nuôi**

| Mã CN | Tên chức năng | Vai trò | Mô tả chi tiết | Input | Output | Quy tắc nghiệp vụ |
|---|---|---|---|---|---|---|
| CN-2.5.1 | Danh sách cấu hình quy trình | R01, R03 | Xem các quy trình chuẩn theo năm/mùa/vụ đã cấu hình | Bộ lọc theo HTX, năm/vụ | Danh sách quy trình | — |
| CN-2.5.2 | Thêm/sửa/xóa quy trình | R03 | Cấu hình các bước/công đoạn chuẩn (VD: bón phân lần 1, phun thuốc, thu hoạch) kèm mốc thời gian dự kiến theo ngày tuổi cây/con | Tên quy trình, danh sách bước (tên bước, mốc thời gian, hướng dẫn) | Quy trình được lưu | Không xóa quy trình đang áp dụng cho mùa vụ hiện hành |
| CN-2.5.3 | Nhân bản quy trình | R03 | Sao chép toàn bộ quy trình từ mùa vụ/năm trước sang mùa vụ mới, cho phép chỉnh sửa trước khi lưu | ID quy trình gốc, tên mùa vụ mới | Quy trình mới (bản sao) | Giảm thao tác nhập lại từ đầu mỗi vụ |

**b) Quản lý nhật ký sản xuất**

| Mã CN | Tên chức năng | Vai trò | Mô tả chi tiết | Input | Output | Quy tắc nghiệp vụ |
|---|---|---|---|---|---|---|
| CN-2.5.4 | Danh sách nhật ký sản xuất | R01, R02, R03 | Xem nhật ký theo vùng/thành viên/khoảng thời gian, dạng danh sách hoặc timeline | Bộ lọc vùng, thành viên, thời gian | Danh sách nhật ký | — |
| CN-2.5.5 | Thêm/sửa/xóa nhật ký sản xuất | R03, R05, R06 | Ghi nhận công việc thực hiện: ngày, loại công việc, vật tư sử dụng, hình ảnh minh họa, ghi chú | Vùng sản xuất, ngày, loại công việc, vật tư, hình ảnh, ghi chú | Nhật ký được lưu | Thành viên (R06) chỉ sửa/xóa được nhật ký của chính mình trong vòng 24h sau khi tạo |
| CN-2.5.6 | Chi tiết nhật ký sản xuất | Tất cả (theo quyền) | Xem đầy đủ 1 bản ghi nhật ký | ID nhật ký | Chi tiết nhật ký | — |
| CN-2.5.7 | Xuất và in nhật ký sản xuất | R01, R02, R03 | Xuất file PDF nhật ký theo vùng/theo mùa vụ để lưu hồ sơ hoặc phục vụ chứng nhận | Bộ lọc vùng/mùa vụ | File PDF | — |
| CN-2.5.8 | Nhắc lịch cập nhật nhật ký sản xuất | Hệ thống tự động | Gửi nhắc nhở (push notification) tới thành viên chưa ghi nhật ký theo tần suất cấu hình | Cấu hình tần suất (CN-1.4) | Thông báo nhắc | Không nhắc quá 1 lần/ngày/thành viên |
| CN-2.5.9 | Gửi thông báo khi có nhật ký sản xuất mới | Hệ thống tự động | Thông báo tới cán bộ kỹ thuật/Ban quản trị khi thành viên vừa ghi nhật ký mới | — | Thông báo | Có thể tắt/bật theo cấu hình vai trò |
| CN-2.5.10 | Mã hóa và lưu vết nhật ký sản xuất | Hệ thống tự động | Sau khi nhật ký được xác nhận (quá thời hạn chỉnh sửa), hệ thống mã hóa/khóa bản ghi và ghi log (ai/khi nào tạo, sửa) để đảm bảo tính toàn vẹn phục vụ truy xuất nguồn gốc | ID nhật ký | Trạng thái "Đã khóa/Đã lưu vết" hiển thị icon khóa | Không thể chỉnh sửa nội dung sau khi đã khóa, chỉ có thể xem |

### 5.6 Nhóm CN-2.6: Dashboard/Báo cáo

| Mã CN | Tên chức năng | Vai trò | Mô tả chi tiết | Input | Output | Quy tắc nghiệp vụ |
|---|---|---|---|---|---|---|
| CN-2.6.1 | Dashboard cho lãnh đạo HTX | R02 | Tổng quan: số thành viên, tổng diện tích/quy mô, sản lượng dự kiến, doanh thu tháng/quý, biểu đồ xu hướng | Bộ lọc thời gian | Bảng số liệu + biểu đồ | Dữ liệu realtime hoặc cập nhật theo lịch (cấu hình) |
| CN-2.6.2 | Dashboard cho thành viên | R06 | Số liệu cá nhân: diện tích/quy mô đang canh tác, sản lượng vụ hiện tại, doanh thu | — | Bảng số liệu cá nhân | — |
| CN-2.6.3 | Báo cáo thành viên | R01, R02 | Thống kê số lượng thành viên theo trạng thái, theo tổ, biến động tăng/giảm theo thời gian | Bộ lọc thời gian, HTX | Bảng + biểu đồ, xuất Excel/PDF | — |
| CN-2.6.4 | Báo cáo sản xuất | R01, R02, R03 | Thống kê diện tích/sản lượng theo vùng, theo mùa vụ, so sánh kế hoạch – thực tế | Bộ lọc thời gian, vùng, mùa vụ | Bảng + biểu đồ, xuất Excel/PDF | — |
| CN-2.6.5 | Báo cáo bán hàng | R01, R02, R04 | Thống kê doanh thu, sản lượng bán theo khách hàng/sản phẩm/thời gian | Bộ lọc thời gian, khách hàng, sản phẩm | Bảng + biểu đồ, xuất Excel/PDF | — |

### 5.7 Nhóm CN-2.7: Quản lý kho

| Mã CN | Tên chức năng | Vai trò | Mô tả chi tiết | Input | Output | Quy tắc nghiệp vụ |
|---|---|---|---|---|---|---|
| CN-2.7.1 | Danh sách vật tư | R01, R03, R04 | Xem danh sách vật tư (giống, phân bón, thuốc, thức ăn chăn nuôi...) kèm tồn kho hiện tại | Từ khóa, loại vật tư | Danh sách vật tư + tồn kho | — |
| CN-2.7.2 | Thêm/sửa/xóa vật tư | R04 | Quản lý danh mục vật tư: tên, đơn vị tính, loại, mức tồn kho tối thiểu (cảnh báo) | Tên, đơn vị tính, loại | Vật tư được lưu | Không xóa nếu đã có phiếu nhập/xuất — chuyển ẩn |
| CN-2.7.3 | Chi tiết vật tư | Tất cả (theo quyền) | Xem thông tin + lịch sử nhập/xuất của 1 vật tư | ID vật tư | Trang chi tiết + lịch sử | — |
| CN-2.7.4 | Danh sách phiếu nhập kho | R01, R04 | Xem danh sách phiếu nhập theo thời gian/nhà cung cấp | Bộ lọc thời gian, đối tác | Danh sách phiếu nhập | — |
| CN-2.7.5 | Thêm/sửa/xóa phiếu nhập kho | R04 | Lập phiếu nhập: nhà cung cấp, danh sách vật tư + số lượng + đơn giá, ngày nhập | Đối tác, danh sách vật tư nhập, số lượng, đơn giá | Phiếu nhập được lưu, tự động cộng tồn kho | Không sửa/xóa phiếu đã quá X ngày (cấu hình) nếu đã đối soát kế toán |
| CN-2.7.6 | Chi tiết phiếu nhập kho | Tất cả (theo quyền) | Xem đầy đủ 1 phiếu nhập | ID phiếu | Chi tiết phiếu nhập | — |
| CN-2.7.7 | Danh sách phiếu xuất kho | R01, R04 | Xem danh sách phiếu xuất theo thời gian/mục đích | Bộ lọc thời gian | Danh sách phiếu xuất | — |
| CN-2.7.8 | Thêm/sửa/xóa phiếu xuất kho | R04 | Lập phiếu xuất: mục đích (cấp cho thành viên/vùng sản xuất), danh sách vật tư + số lượng | Vùng/thành viên nhận, danh sách vật tư xuất, số lượng | Phiếu xuất được lưu, tự động trừ tồn kho | Không cho xuất vượt quá tồn kho hiện có |
| CN-2.7.9 | Chi tiết phiếu xuất kho | Tất cả (theo quyền) | Xem đầy đủ 1 phiếu xuất | ID phiếu | Chi tiết phiếu xuất | — |

### 5.8 Nhóm CN-2.8: Quản lý thu hoạch

| Mã CN | Tên chức năng | Vai trò | Mô tả chi tiết | Input | Output | Quy tắc nghiệp vụ |
|---|---|---|---|---|---|---|
| CN-2.8.1 | Danh sách lô thu hoạch | R01, R02, R03 | Xem danh sách các lô đã thu hoạch theo vùng/thời gian | Bộ lọc vùng, thời gian | Danh sách lô thu hoạch | — |
| CN-2.8.2 | Thêm/sửa/xóa lô thu hoạch | R03, R06 | Ghi nhận lô thu hoạch: vùng sản xuất, ngày thu hoạch, sản lượng, đơn vị tính, hình ảnh | Vùng, ngày, sản lượng, hình ảnh | Lô thu hoạch được lưu | Sản lượng phải > 0; không xóa nếu lô đã dùng để tạo lô sơ chế/đóng gói |
| CN-2.8.3 | Chi tiết lô thu hoạch | Tất cả (theo quyền) | Xem đầy đủ thông tin 1 lô thu hoạch, liên kết ngược tới nhật ký sản xuất liên quan | ID lô | Chi tiết lô thu hoạch | — |

### 5.9 Nhóm CN-2.9: Quản lý sơ chế

| Mã CN | Tên chức năng | Vai trò | Mô tả chi tiết | Input | Output | Quy tắc nghiệp vụ |
|---|---|---|---|---|---|---|
| CN-2.9.1 | Danh sách lô sơ chế | R01, R03 | Xem danh sách lô sơ chế theo thời gian, theo lô thu hoạch gốc | Bộ lọc thời gian | Danh sách lô sơ chế | — |
| CN-2.9.2 | Thêm/sửa/xóa lô sơ chế | R03 | Ghi nhận sơ chế: chọn lô thu hoạch đầu vào, phương pháp sơ chế, sản lượng đầu ra, hao hụt, hình ảnh | Lô thu hoạch gốc, phương pháp, sản lượng đầu ra | Lô sơ chế được lưu | Sản lượng đầu ra ≤ sản lượng lô thu hoạch gốc (cảnh báo nếu vượt) |
| CN-2.9.3 | Chi tiết lô sơ chế | Tất cả (theo quyền) | Xem đầy đủ thông tin, liên kết ngược tới lô thu hoạch | ID lô sơ chế | Chi tiết lô sơ chế | — |

### 5.10 Nhóm CN-2.10: Quản lý đóng gói sản phẩm

| Mã CN | Tên chức năng | Vai trò | Mô tả chi tiết | Input | Output | Quy tắc nghiệp vụ |
|---|---|---|---|---|---|---|
| CN-2.10.1 | Danh sách mã sản phẩm | R01, R03, R04 | Xem danh sách mã sản phẩm đã tạo theo lô (mùa/vụ/hộ/lô sơ chế/lô đóng gói/sản phẩm) | Bộ lọc theo lô, sản phẩm, thời gian | Danh sách mã sản phẩm | — |
| CN-2.10.2 | Thêm/sửa/xóa mã sản phẩm theo lô | R03 | Tạo mã sản phẩm gắn với chuỗi truy xuất: mùa vụ → hộ sản xuất → lô sơ chế → lô đóng gói → sản phẩm, số lượng đơn vị đóng gói | Lô sơ chế/thu hoạch, sản phẩm, số lượng gói, quy cách đóng gói | Mã sản phẩm được lưu | Mỗi mã sản phẩm là duy nhất toàn hệ thống |
| CN-2.10.3 | Tạo mã QRCode cho sản phẩm | Hệ thống tự động (kích hoạt bởi R03) | Sinh mã QR gắn với đường link trang truy xuất nguồn gốc công khai cho từng mã sản phẩm | ID mã sản phẩm | Ảnh mã QR | Mã QR không đổi trong suốt vòng đời sản phẩm đó |
| CN-2.10.4 | Tải và in QRCode theo mẫu của HTX | R03, R04 | Xuất file in tem QR theo mẫu thiết kế riêng từng HTX (logo, thông tin cơ bản kèm QR) | ID mã sản phẩm hoặc danh sách, chọn mẫu tem | File PDF/ảnh để in | Mỗi HTX có ít nhất 1 mẫu tem mặc định, có thể tùy biến |

### 5.11 Nhóm CN-2.11: Quản lý tiêu thụ - bán hàng

| Mã CN | Tên chức năng | Vai trò | Mô tả chi tiết | Input | Output | Quy tắc nghiệp vụ |
|---|---|---|---|---|---|---|
| CN-2.11.1 | Danh sách đơn hàng bán | R01, R04 | Xem danh sách đơn hàng theo trạng thái/khách hàng/thời gian | Bộ lọc trạng thái, khách hàng, thời gian | Danh sách đơn hàng | — |
| CN-2.11.2 | Thêm/sửa/xóa đơn hàng bán | R04, R06 | Lập đơn hàng cho đại lý/CTV/khách hàng: chọn khách hàng, sản phẩm (mã sản phẩm/lô), số lượng, đơn giá | Khách hàng, danh sách sản phẩm, số lượng, đơn giá | Đơn hàng được lưu, cập nhật trạng thái tồn kho thành phẩm | Không xóa đơn đã xuất hóa đơn — chỉ hủy có ghi lý do |
| CN-2.11.3 | Chi tiết đơn hàng bán | Tất cả (theo quyền) | Xem đầy đủ đơn hàng + lịch sử trạng thái | ID đơn hàng | Chi tiết đơn hàng | — |
| CN-2.11.4 | Xuất hóa đơn điện tử | R04 | Sinh hóa đơn điện tử từ đơn hàng đã xác nhận, tuân thủ định dạng hóa đơn điện tử hiện hành | ID đơn hàng | File hóa đơn điện tử (PDF/XML), gửi qua email/Zalo cho khách hàng nếu cần | Yêu cầu tích hợp với đơn vị cung cấp hóa đơn điện tử (qua API) |
| CN-2.11.5 | Báo cáo doanh thu/doanh số bán hàng | R01, R02, R04 | Thống kê doanh thu theo thời gian/khách hàng/sản phẩm | Bộ lọc thời gian, khách hàng, sản phẩm | Bảng + biểu đồ, xuất Excel/PDF | — |

### 5.12 Nhóm CN-2.12: Trang hiển thị thông tin truy xuất nguồn gốc

| Mã CN | Tên chức năng | Vai trò | Mô tả chi tiết | Input | Output | Quy tắc nghiệp vụ |
|---|---|---|---|---|---|---|
| CN-2.12.1 | Chi tiết thông tin truy xuất nguồn gốc sản phẩm | R07 (công khai, không cần đăng nhập) | Trang public hiển thị hành trình sản phẩm: HTX sản xuất, vùng trồng/nuôi, hộ sản xuất, mốc thời gian (gieo trồng/chăm sóc → thu hoạch → sơ chế → đóng gói), chứng nhận (nếu có) | Mã sản phẩm (quét từ QR) | Trang thông tin truy xuất (giao diện tối ưu mobile) | Không hiển thị thông tin nhạy cảm nội bộ (giá vốn, SĐT cá nhân đầy đủ...) |

---

## 6. YÊU CẦU CHỨC NĂNG CHI TIẾT — MODULE 3: ZALO MINI APP

> Zalo Mini App tái sử dụng phần lớn nghiệp vụ của Module 2 nhưng **giới hạn phạm vi dữ liệu theo hộ/thành viên đăng nhập** và **tối giản hóa luồng thao tác** theo nguyên tắc UX tại Mục 10. Các quy tắc nghiệp vụ CRUD giống Module 2 tương ứng, chỉ khác về UI/luồng nhập liệu.

### 6.1 Người dùng và bảo mật

> **Nguyên tắc xác thực:** Zalo Mini App **chỉ đăng nhập bằng Zalo**. Không hiển thị và không hỗ trợ đăng nhập bằng username/số điện thoại + mật khẩu; không có chức năng đổi mật khẩu hoặc quên/reset mật khẩu trên Mini App. Hệ thống sử dụng thông tin định danh do nền tảng Zalo cung cấp để xác thực và liên kết với người dùng nội bộ.

| Mã CN | Tên chức năng | Mô tả chi tiết | Input | Output |
|---|---|---|---|---|
| CN-3.1.1 | Đăng nhập bằng Zalo | Khi người dùng mở Mini App, ứng dụng yêu cầu quyền xác thực Zalo theo cơ chế của nền tảng. Mini App gửi thông tin/token xác thực Zalo về Backend; Backend kiểm tra tính hợp lệ và dùng **Zalo User ID** để tìm tài khoản/người dùng đã liên kết trong hệ thống. Nếu tài khoản đang hoạt động thì cấp phiên đăng nhập và chuyển vào trang chủ theo vai trò. Nếu chưa có liên kết thì chuyển sang luồng đăng ký thành viên. Nếu hồ sơ đang **Chờ duyệt** thì hiển thị trạng thái chờ duyệt; nếu bị **Từ chối/Ngừng hoạt động** thì không cho truy cập chức năng nghiệp vụ và hiển thị thông báo phù hợp. | Thông tin/token xác thực từ Zalo, Zalo User ID | Phiên đăng nhập hệ thống + thông tin người dùng/vai trò; hoặc trạng thái Chưa đăng ký/Chờ duyệt/Từ chối/Ngừng hoạt động |
| CN-3.1.2 | Đăng xuất | Xóa phiên đăng nhập nội bộ của Mini App. Lần truy cập tiếp theo hệ thống thực hiện lại bước xác thực Zalo; không yêu cầu nhập tài khoản/mật khẩu. | — | Kết thúc phiên hiện tại |
| CN-3.1.3 | Nhận thông báo | Nhận push notification từ hệ thống (nhắc nhật ký, thông báo mới, kết quả phê duyệt...) theo khả năng/quyền được Zalo cho phép. | — | Thông báo hiển thị trên Zalo/Mini App |
| CN-3.1.4 | Thông tin tài khoản | Xem/sửa thông tin cá nhân nghiệp vụ được phép cập nhật. Ảnh đại diện/tên Zalo có thể lấy từ thông tin Zalo nếu người dùng đã cấp quyền; dữ liệu hồ sơ HTX vẫn do hệ thống quản lý. | Họ tên, SĐT (nếu được cung cấp), ảnh đại diện, thông tin hồ sơ được phép sửa | Hồ sơ cập nhật |
| CN-3.1.5 | Đăng ký thành viên bằng Zalo | Người dùng đã xác thực Zalo nhưng chưa có hồ sơ trong hệ thống được chuyển tới form đăng ký: chọn HTX muốn tham gia, nhập thông tin cơ bản, gửi yêu cầu chờ duyệt (liên kết CN-2.3.5). Hệ thống lưu **Zalo User ID** để liên kết định danh; không tạo mật khẩu cho người dùng Mini App. | Zalo User ID, họ tên, SĐT (nếu có/được cấp quyền), CCCD, HTX muốn tham gia | Yêu cầu đăng ký ở trạng thái "Chờ duyệt" và liên kết với Zalo User ID |

**Luồng đăng nhập Zalo Mini App:**
1. Người dùng mở Mini App trong Zalo.
2. Mini App lấy thông tin/token xác thực Zalo theo quyền người dùng cho phép và gửi về Backend.
3. Backend xác thực token/thông tin với cơ chế phù hợp của nền tảng Zalo, lấy Zalo User ID.
4. Hệ thống tra cứu `NguoiDung`/`ThanhVien` theo Zalo User ID.
5. Xử lý theo trạng thái:
   - **Đã liên kết + Active** → cấp token/phiên hệ thống → vào Trang chủ theo vai trò.
   - **Chưa có hồ sơ** → mở form Đăng ký thành viên → gửi yêu cầu chờ duyệt.
   - **Pending/Chờ duyệt** → hiển thị màn hình "Hồ sơ đang chờ duyệt", chưa cho dùng chức năng nghiệp vụ.
   - **Rejected/Từ chối hoặc Inactive/Ngừng hoạt động** → không cho truy cập nghiệp vụ, hiển thị lý do/hướng dẫn liên hệ HTX (nếu có).
6. Không có bất kỳ màn hình nhập **tài khoản/mật khẩu**, **đổi mật khẩu** hoặc **quên mật khẩu** trên Zalo Mini App.

### 6.2 Quản lý thành viên HTX (vai trò R05 Tổ trưởng)

| Mã CN | Tên chức năng | Mô tả chi tiết |
|---|---|---|
| CN-3.2.1 | Danh sách thành viên | Xem danh sách thành viên thuộc tổ/HTX phụ trách, dạng thẻ card |
| CN-3.2.2 | Thêm/sửa/xóa thành viên | Tổ trưởng hỗ trợ tạo/cập nhật hồ sơ thành viên trong tổ (giống CN-2.3.2, thu gọn trường nhập) |
| CN-3.2.3 | Chi tiết thành viên | Xem hồ sơ + lịch sử sản xuất của thành viên |
| CN-3.2.4 | Phê duyệt thành viên | Duyệt/từ chối nhanh bằng 2 nút lớn (giống CN-2.3.5) |

### 6.3 Quản lý vùng trồng (vai trò R06 Thành viên)

| Mã CN | Tên chức năng | Mô tả chi tiết |
|---|---|---|
| CN-3.3.1 | Danh sách vùng sản xuất | Xem vùng sản xuất của chính hộ mình, dạng thẻ lớn kèm ảnh |
| CN-3.3.2 | Thêm/sửa/xóa vùng sản xuất | Form tối giản: chọn giống/mùa vụ từ danh mục có sẵn (dropdown lớn), không gõ tay |
| CN-3.3.3 | Chi tiết vùng sản xuất | Xem thông tin vùng, lịch sử canh tác |
| CN-3.3.4 | Dự báo sản lượng | Hiển thị số to, ngôn ngữ đơn giản: "Dự kiến thu: 2 tấn – còn 25 ngày" |

### 6.4 Dashboard/Báo cáo

| Mã CN | Tên chức năng | Mô tả chi tiết |
|---|---|---|
| CN-3.4.1 | Dashboard cho lãnh đạo HTX | Giống CN-2.6.1, thu gọn cho màn hình di động |
| CN-3.4.2 | Dashboard cho thành viên | Giống CN-2.6.2, tối đa 3 chỉ số/biểu đồ chính trên 1 màn hình |
| CN-3.4.3 | Báo cáo quản trị | 3 tab: Báo cáo thành viên / sản xuất / bán hàng, dạng rút gọn, xem trên di động |

### 6.5 Quản lý nhật ký sản xuất ("Sổ nhật ký đồng ruộng")

| Mã CN | Tên chức năng | Mô tả chi tiết |
|---|---|---|
| CN-3.5.1 | Danh sách nhật ký sản xuất | Dạng timeline theo ngày, icon minh họa loại công việc |
| CN-3.5.2 | Thêm/sửa/xóa nhật ký sản xuất | Luồng 4 bước: (1) chọn ngày – mặc định hôm nay, (2) chọn loại công việc bằng icon lớn, (3) chụp ảnh trực tiếp bằng camera, (4) ghi chú ngắn (tùy chọn) → xác nhận lưu |
| CN-3.5.3 | Chi tiết nhật ký sản xuất | Xem lại đầy đủ 1 bản ghi |
| CN-3.5.4 | Nhắc lịch cập nhật nhật ký | Banner nổi bật ở trang chủ: "Hôm nay bạn chưa ghi nhật ký" |
| CN-3.5.5 | Gửi thông báo khi có nhật ký mới | Gửi tới cán bộ kỹ thuật/tổ trưởng khi thành viên vừa ghi nhật ký |
| CN-3.5.6 | Mã hóa và lưu vết nhật ký | Giống CN-2.5.10, hiển thị icon khóa kèm chú thích dễ hiểu "Đã lưu, không thể sửa" |

### 6.6 Quản lý thu hoạch

| Mã CN | Tên chức năng | Mô tả chi tiết |
|---|---|---|
| CN-3.6.1 | Danh sách lô thu hoạch | Dạng thẻ card: ngày, sản lượng, vùng trồng |
| CN-3.6.2 | Thêm/sửa/xóa lô thu hoạch | Chọn vùng → nhập sản lượng bằng bộ đếm +/- → chụp ảnh → lưu |
| CN-3.6.3 | Chi tiết lô thu hoạch | Xem đầy đủ thông tin |

### 6.7 Quản lý đóng gói sản phẩm

| Mã CN | Tên chức năng | Mô tả chi tiết |
|---|---|---|
| CN-3.7.1 | Danh sách mã sản phẩm | Thẻ card có ảnh QR nhỏ + tên sản phẩm |
| CN-3.7.2 | Thêm/sửa/xóa mã sản phẩm theo lô | Chọn lô → nhập số lượng gói bằng bộ đếm +/- |
| CN-3.7.3 | Tạo mã QRCode cho sản phẩm | Tự động sinh sau khi tạo mã sản phẩm |
| CN-3.7.4 | Tải và in QRCode theo mẫu HTX | Nút "Chia sẻ qua Zalo" và "In" ngay trên màn hình xem QR |

### 6.8 Quản lý kho (vai trò R04 dùng trên Mini App khi ở ngoài đồng)

| Mã CN | Tên chức năng | Mô tả chi tiết |
|---|---|---|
| CN-3.8.1 | Danh sách vật tư | Giống CN-2.7.1, dạng thẻ lớn |
| CN-3.8.2 | Thêm/sửa/xóa vật tư | Form tối giản |
| CN-3.8.3 | Chi tiết vật tư | Xem tồn kho, lịch sử |
| CN-3.8.4–5 | Nhập kho (danh sách/thêm/sửa/xóa/chi tiết) | Giống CN-2.7.4–2.7.6, rút gọn trường nhập |
| CN-3.8.6–7 | Xuất kho (danh sách/thêm/sửa/xóa/chi tiết) | Giống CN-2.7.7–2.7.9, rút gọn trường nhập |

### 6.9 Quản lý tiêu thụ - bán hàng

| Mã CN | Tên chức năng | Mô tả chi tiết |
|---|---|---|
| CN-3.9.1 | Danh sách đơn hàng bán | Thẻ card: khách hàng, số lượng, trạng thái (Mới/Đang giao/Hoàn thành) |
| CN-3.9.2 | Thêm/sửa/xóa đơn hàng bán | Chọn khách hàng có sẵn hoặc thêm nhanh → chọn sản phẩm → nhập số lượng bằng bộ đếm +/- |
| CN-3.9.3 | Chi tiết đơn hàng bán | Xem đầy đủ thông tin và trạng thái |
| CN-3.9.4 | Xuất hóa đơn điện tử | Giống CN-2.11.4, xem trước trên di động |
| CN-3.9.5 | Báo cáo doanh thu/doanh số | Dạng rút gọn cho di động |

### 6.10 Truy xuất nguồn gốc

| Mã CN | Tên chức năng | Mô tả chi tiết |
|---|---|---|
| CN-3.10.1 | Quét mã QRCode từ sản phẩm | Mở camera trực tiếp, hướng dẫn bằng hình minh họa |
| CN-3.10.2 | Hiển thị thông tin QRCode | Hiển thị kết quả truy xuất, giống CN-2.12.1, tối ưu đọc nhanh trên di động |

### 6.11 Thông báo

| Mã CN | Tên chức năng | Mô tả chi tiết |
|---|---|---|
| CN-3.11.1 | Danh sách thông báo | Danh sách dạng list, icon chuông, đánh dấu đã đọc/chưa đọc |
| CN-3.11.2 | Chi tiết thông báo | Xem nội dung đầy đủ 1 thông báo |

---

## 7. MA TRẬN PHÂN QUYỀN CHỨC NĂNG THEO VAI TRÒ

| Nhóm chức năng | R01 Admin | R02 Ban QT HTX | R03 Cán bộ KT | R04 Kế toán/BH | R05 Tổ trưởng | R06 Thành viên |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| Quản trị hệ thống (M1) | Toàn quyền | — | — | — | — | — |
| Thông tin chung HTX | Xem | Sửa | Xem | Xem | Xem | Xem |
| Danh mục giống/mùa vụ/đối tác | Toàn quyền | Xem | Toàn quyền (giống/mùa vụ) | Toàn quyền (đối tác/KH/CTV) | Xem | Xem |
| Quản lý thành viên | Xem toàn bộ | Toàn quyền + Duyệt | Thêm/Sửa | Xem | Thêm/Sửa (trong tổ) + Duyệt | Xem hồ sơ mình |
| Vùng sản xuất & quy trình | Xem toàn bộ | Xem | Toàn quyền | Xem | Xem (trong tổ) | Toàn quyền (vùng của mình) |
| Nhật ký sản xuất | Xem toàn bộ | Xem | Toàn quyền | — | Xem/Hỗ trợ (trong tổ) | Toàn quyền (nhật ký của mình, có giới hạn thời gian sửa) |
| Dashboard/Báo cáo | Toàn hệ thống | Theo HTX | Theo HTX (sản xuất) | Theo HTX (bán hàng) | Theo tổ | Cá nhân |
| Kho (vật tư/nhập/xuất) | Xem toàn bộ | Xem | Xem | Toàn quyền | — | Xem (vật tư được cấp) |
| Thu hoạch/Sơ chế/Đóng gói | Xem toàn bộ | Xem | Toàn quyền | Xem | Xem | Toàn quyền (của hộ mình) |
| Bán hàng/Hóa đơn | Xem toàn bộ | Xem | — | Toàn quyền | — | Tạo đơn của hộ mình |
| Truy xuất nguồn gốc (public) | — | — | — | — | — | — (mở cho R07 công khai) |

> Ghi chú: Ma trận trên là khung tổng quát; chi tiết quyền theo từng chức năng con (Xem/Thêm/Sửa/Xóa/Duyệt/Xuất) được cấu hình linh hoạt tại chức năng **CN-1.2 Quản lý nhóm quyền**, không hard-code trong hệ thống.

---

## 8. MÔ HÌNH DỮ LIỆU (DATA DICTIONARY) CHÍNH

Danh sách các thực thể dữ liệu cốt lõi (chi tiết trường dữ liệu sẽ được đặc tả ở tài liệu thiết kế CSDL riêng):

| Thực thể | Mô tả | Quan hệ chính |
|---|---|---|
| `HTX` | Thông tin hợp tác xã | 1–n `ThanhVien`, `VungSanXuat`, `VatTu`, `KhachHang` |
| `NguoiDung` | Tài khoản/định danh người dùng hệ thống; với Zalo Mini App lưu định danh liên kết như `ZaloUserId` để xác thực không mật khẩu | n–n `NhomQuyen`; 1–1 `ThanhVien` (nếu là nông dân) |
| `NhomQuyen` | Nhóm quyền và danh sách quyền chi tiết | n–n `NguoiDung`, `ChucNang` |
| `ThanhVien` | Hồ sơ thành viên/hộ sản xuất | thuộc `HTX`, 1–n `VungSanXuat` |
| `DanhMuc` (Master Data) | Danh mục dùng chung (đơn vị tính, loại vật tư...) | tham chiếu bởi nhiều thực thể |
| `GiongCayVatNuoi` | Danh mục giống theo HTX | thuộc `HTX`, tham chiếu bởi `VungSanXuat` |
| `MuaVu` | Cấu hình mùa vụ/lứa nuôi | thuộc `HTX`, tham chiếu bởi `VungSanXuat`, `QuyTrinh` |
| `VungSanXuat` | Vùng trồng/chuồng trại/ao nuôi | thuộc `ThanhVien`, `HTX`; 1–n `NhatKySanXuat`, `LoThuHoach` |
| `QuyTrinhSanXuat` | Quy trình chuẩn theo mùa vụ | thuộc `HTX`, `MuaVu` |
| `NhatKySanXuat` | Nhật ký công việc hàng ngày | thuộc `VungSanXuat`, `ThanhVien` |
| `LoThuHoach` | Lô thu hoạch | thuộc `VungSanXuat`; 1–n `LoSoChe` |
| `LoSoChe` | Lô sơ chế | thuộc `LoThuHoach`; 1–n `MaSanPham` |
| `MaSanPham` | Mã sản phẩm/mã QR đóng gói | thuộc `LoSoChe`; dùng cho `DonHangBan`, trang truy xuất công khai |
| `VatTu` | Danh mục vật tư | thuộc `HTX`; 1–n `PhieuNhapKho`, `PhieuXuatKho` |
| `PhieuNhapKho` / `PhieuXuatKho` | Chứng từ kho | thuộc `HTX`, `VatTu`, `DoiTac`/`ThanhVien` |
| `DoiTac` / `CongTacVien` / `KhachHang` | Danh mục các bên liên quan | thuộc `HTX` |
| `DonHangBan` | Đơn hàng bán | thuộc `HTX`, `KhachHang`; 1–n `ChiTietDonHang`; 1–1 `HoaDonDienTu` |
| `TaiLieuHTX` | Hồ sơ/tài liệu HTX | thuộc `HTX`, `DanhMucTaiLieu` |
| `ThongBao` | Thông báo hệ thống | n–n `NguoiDung`/`ThanhVien` |
| `AuditLog` | Nhật ký thao tác hệ thống | tham chiếu tới mọi thực thể nghiệp vụ quan trọng |

---

## 9. YÊU CẦU PHI CHỨC NĂNG

| Nhóm | Yêu cầu |
|---|---|
| Hiệu năng | Thời gian phản hồi API < 2 giây với 95% request trong điều kiện tải bình thường; danh sách dữ liệu lớn phải phân trang/lazy-load |
| Khả năng mở rộng | Kiến trúc multi-tenant cho phép thêm HTX mới sau thí điểm mà không cần sửa code, chỉ cấu hình dữ liệu |
| Bảo mật | Web Admin: mật khẩu phải được mã hóa (hash+salt), giới hạn số lần đăng nhập sai. Zalo Mini App: không lưu/không sử dụng mật khẩu, phải xác thực thông tin/token Zalo ở Backend và liên kết theo Zalo User ID. Toàn hệ thống dùng HTTPS, phân quyền RBAC, chống SQL Injection/XSS và quản lý phiên/token an toàn. |
| Toàn vẹn dữ liệu | Nhật ký sản xuất sau khi khóa không thể sửa (chỉ xem), có audit log cho các thao tác thêm/sửa/xóa dữ liệu nghiệp vụ trọng yếu |
| Khả dụng | Hệ thống hoạt động ổn định trên hạ tầng cloud, có cơ chế sao lưu (backup) dữ liệu định kỳ hàng ngày |
| Tương thích | Web hoạt động tốt trên các trình duyệt phổ biến (Chrome, Safari, Edge) và tối ưu cho màn hình di động; Zalo Mini App tương thích với ứng dụng Zalo phiên bản hiện hành |
| Đường truyền yếu | Zalo Mini App cần xử lý tốt trong điều kiện mạng nông thôn không ổn định: cho phép lưu tạm (cache) dữ liệu nhập dở, tự động gửi lại khi có mạng |
| Ngôn ngữ | Toàn bộ giao diện bằng tiếng Việt, không dùng thuật ngữ kỹ thuật khó hiểu (đặc biệt trên Zalo Mini App) |
| Khả năng bảo trì | Code tuân thủ chuẩn coding convention của Angular/.NET Core, có tài liệu API (Swagger/OpenAPI) |
| Đào tạo & hỗ trợ | Có tài liệu hướng dẫn sử dụng riêng cho từng nhóm người dùng (Công việc 8, Nội dung 4) |

---

## 10. YÊU CẦU GIAO DIỆN NGƯỜI DÙNG (UI/UX)

Đối tượng sử dụng chính (đặc biệt trên Zalo Mini App) là **nông dân lớn tuổi, trình độ công nghệ thấp**. Toàn bộ giao diện phải tuân thủ:

1. Cỡ chữ tối thiểu 16–18px (nội dung), 22–24px (tiêu đề/số liệu quan trọng); tương phản màu cao.
2. Nút bấm tối thiểu 44–48px chiều cao, khoảng cách đủ rộng tránh bấm nhầm.
3. Icon luôn đi kèm nhãn chữ, không dùng icon đơn độc.
4. Luồng thao tác ngắn gọn (tối đa 2–4 bước cho mỗi tác vụ), ưu tiên chọn/chạm hơn gõ chữ (dropdown, bộ đếm +/-, chụp ảnh trực tiếp, chọn ngày bằng lịch popup).
5. Ngôn ngữ thuần Việt, gần gũi, tránh thuật ngữ kỹ thuật (VD: "Sổ nhật ký đồng ruộng" thay vì "Quản lý nhật ký sản xuất").
6. Luôn xác nhận rõ ràng trước khi xóa/gửi dữ liệu quan trọng bằng hộp thoại lớn, dễ hiểu.
7. Phản hồi tức thì sau mọi thao tác (banner/toast rõ ràng, đủ thời gian đọc).
8. Trạng thái dữ liệu luôn thể hiện bằng màu **kèm chữ mô tả** (không chỉ dựa vào màu sắc).
9. Điều hướng cố định, nhất quán: bottom navigation tối đa 4–5 mục trên Mini App; sidebar rõ ràng trên Web.
10. Danh sách dữ liệu dài trên di động hiển thị dạng thẻ (card), không bắt cuộn ngang bảng.
11. Màn hình rỗng phải có hướng dẫn bước tiếp theo bằng hình ảnh + lời văn thân thiện, không để trắng khó hiểu.
12. Trang truy xuất nguồn gốc công khai phải tối ưu hiển thị trên điện thoại vì người xem là người tiêu dùng phổ thông.
13. Zalo Mini App tuân thủ ngôn ngữ thiết kế (design guideline) chuẩn của nền tảng Zalo (zmp-ui).

---

## 11. RÀNG BUỘC, GIẢ ĐỊNH VÀ PHỤ THUỘC

### 11.1 Ràng buộc
- Hệ thống phải triển khai được trên hạ tầng cloud trong nước, đảm bảo tuân thủ quy định về dữ liệu.
- Ngân sách và thời gian thí điểm giới hạn trong phạm vi 3 HTX, do đó thiết kế phải đơn giản hóa tối đa để dễ đào tạo trong thời gian ngắn.
- Zalo Mini App phụ thuộc vào chính sách/giới hạn kỹ thuật của nền tảng Zalo (kích thước gói, API cho phép).

### 11.2 Giả định
- Thành viên HTX có điện thoại thông minh cài đặt sẵn ứng dụng Zalo.
- Có kết nối Internet (3G/4G/Wifi) tại khu vực sản xuất, dù có thể không ổn định.
- Ban quản trị HTX và cán bộ kỹ thuật được đào tạo sử dụng Web Admin trước khi hướng dẫn lại cho thành viên.

### 11.3 Phụ thuộc
- Tích hợp dịch vụ hóa đơn điện tử của bên thứ ba (CN-2.11.4).
- Tích hợp SMS/OTP/email cho luồng quên mật khẩu của Web Admin (CN-1.1.3).
- Tích hợp cơ chế xác thực/ủy quyền của nền tảng Zalo để lấy và kiểm tra định danh người dùng cho Zalo Mini App (CN-3.1.1); không sử dụng mật khẩu trên Mini App.
- Tích hợp thư viện sinh mã QR (CN-2.10.3).

---

## 12. PHỤ LỤC: BẢNG TỔNG HỢP TOÀN BỘ CHỨC NĂNG (THEO FILE GỐC)

| Module | Nhóm chức năng | Số lượng chức năng con | Mã tham chiếu SRS |
|---|---|---|---|
| M1 – Quản trị hệ thống | Người dùng và bảo mật | 3 | CN-1.1.x |
| M1 | Quản lý nhóm quyền | 4 | CN-1.2.x |
| M1 | Cấu hình tham số hệ thống | 1 | CN-1.4.x |
| M1 | Quản lý danh mục dùng chung | 4 | CN-1.5.x |
| M1 | Quản lý file thông tin kỹ thuật | 2 | CN-1.6.x |
| M1 | Quản lý thông báo | 3 | CN-1.7.x |
| M2 – CSDL & Quản trị HTX | Quản lý CSDL liên quan HTX (thông tin chung, giống, mùa vụ, đối tác, CTV, khách hàng) | 12 | CN-2.1.x |
| M2 | Quản lý hồ sơ/tài liệu HTX | 3 | CN-2.2.x |
| M2 | Quản lý thành viên HTX | 5 | CN-2.3.x |
| M2 | Quản lý vùng trồng/chăn nuôi | 4 | CN-2.4.x |
| M2 | Quản lý sản xuất (quy trình + nhật ký) | 10 | CN-2.5.x |
| M2 | Dashboard/Báo cáo | 5 | CN-2.6.x |
| M2 | Quản lý kho | 9 | CN-2.7.x |
| M2 | Quản lý thu hoạch | 3 | CN-2.8.x |
| M2 | Quản lý sơ chế | 3 | CN-2.9.x |
| M2 | Quản lý đóng gói sản phẩm | 4 | CN-2.10.x |
| M2 | Quản lý tiêu thụ - bán hàng | 5 | CN-2.11.x |
| M2 | Trang truy xuất nguồn gốc | 1 | CN-2.12.x |
| M3 – Zalo Mini App | Người dùng và bảo mật | 5 | CN-3.1.x |
| M3 | Quản lý thành viên HTX | 4 | CN-3.2.x |
| M3 | Quản lý vùng trồng | 4 | CN-3.3.x |
| M3 | Dashboard/Báo cáo | 3 | CN-3.4.x |
| M3 | Quản lý nhật ký sản xuất | 6 | CN-3.5.x |
| M3 | Quản lý thu hoạch | 3 | CN-3.6.x |
| M3 | Quản lý đóng gói sản phẩm | 4 | CN-3.7.x |
| M3 | Quản lý kho | 9 | CN-3.8.x |
| M3 | Quản lý tiêu thụ - bán hàng | 5 | CN-3.9.x |
| M3 | Truy xuất nguồn gốc | 2 | CN-3.10.x |
| M3 | Thông báo | 2 | CN-3.11.x |

**Tổng cộng: ~113 chức năng con** (đã nhóm từ 174 dòng dữ liệu gốc trong file Excel, loại trừ các dòng tiêu đề nhóm).

---

*Hết tài liệu SRS phiên bản 1.1. Tài liệu cần được rà soát cùng Ban quản trị 3 HTX thí điểm và Sở NN&PTNT Hưng Yên trước khi chuyển sang giai đoạn thiết kế chi tiết (database design, wireframe/UI design, API design).*
