import React from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/Header';

export const TraceResult: React.FC = () => {
  const { screenParams, speakText, navigateTo } = useApp();
  const code = screenParams?.code || 'TXNG-HY-AN-BT7-089';

  // Customize info based on code
  const isGa = code.includes('DT-GA');
  const isNhan = code.includes('QT-NHAN');

  const productData = isGa
    ? {
        name: 'Gà đặc sản Đông Tảo thuần chủng chân to',
        htx: 'HTX Chăn nuôi & Kinh doanh Gà Đông Tảo',
        location: 'Xã Đông Tảo, huyện Khoái Châu, tỉnh Hưng Yên',
        farmer: 'Bác Trần Đình Trọng (Tổ 2 chăn nuôi)',
        zone: 'Khu chuồng nuôi thả vườn Vườn Nhãn (Đàn 450 con)',
        lotCode: 'TH-DT-2026-003',
        standard: 'OCOP 4 sao • Chuỗi nông sản an toàn Hưng Yên',
        photo: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=600&auto=format&fit=crop&q=80',
        harvestDate: '12/09/2026',
        packDate: '12/09/2026',
        expiryDate: '12/10/2026',
        journey: [
          { time: '02/2026', title: 'Chọn con giống', desc: 'Gà Đông Tảo thuần chủng đời F1 chân vảy rồng khỏe mạnh.' },
          { time: '05/2026', title: 'Chăm sóc sinh học', desc: 'Thức ăn ngô mảnh ủ men vi sinh, uống nước thảo dược tự nhiên.' },
          { time: '08/2026', title: 'Kiểm dịch thú y', desc: 'Đạt xét nghiệm mẫu không tồn dư kháng sinh độc hại.' },
          { time: '09/2026', title: 'Thu hoạch & Đóng gói', desc: 'Hút chân không, dán tem QR truy xuất điện tử HTX.' },
        ],
      }
    : isNhan
    ? {
        name: 'Nhãn lồng tiến vua Hương Chi Hưng Yên',
        htx: 'HTX Cây ăn quả đặc sản & NTTS Quyết Thắng',
        location: 'Thôn Quyết Thắng, xã Tân Hưng, TP. Hưng Yên',
        farmer: 'Bác Phạm Thị Mai (Hộ thành viên tiêu biểu)',
        zone: 'Vườn Nhãn Hương Chi - Khu A (1,2 hecta)',
        lotCode: 'TH-QT-2026-005',
        standard: 'VietGAP • Chỉ dẫn địa lý Nhãn lồng Hưng Yên',
        photo: 'https://images.unsplash.com/photo-1618897996318-5a901fa6ca71?w=600&auto=format&fit=crop&q=80',
        harvestDate: '10/09/2026',
        packDate: '10/09/2026',
        expiryDate: '20/09/2026',
        journey: [
          { time: '01/2026', title: 'Tỉa cành & bón lót', desc: 'Bón phân hữu cơ vi sinh, tưới nước tự động.' },
          { time: '04/2026', title: 'Đậu quả & bao chùm', desc: 'Bao chùm quả bảo vệ sinh học, không dùng hóa chất cấm.' },
          { time: '09/2026', title: 'Thu hái chọn lọc', desc: 'Hái tay từng chùm quả to đều, cùi dày ráo nước, độ ngọt cao.' },
          { time: '09/2026', title: 'Đóng hộp dán tem', desc: 'Đóng hộp có tem QR chống hàng giả của HTX Quyết Thắng.' },
        ],
      }
    : {
        name: 'Gạo sạch Bắc Thơm số 7 Hưng Yên (Túi 5kg)',
        htx: 'HTX Dịch vụ Nông nghiệp An Ninh',
        location: 'Xã An Ninh, huyện Tiền Lữ, tỉnh Hưng Yên',
        farmer: 'Bác Nguyễn Văn An (Tổ 1 Lúa sạch)',
        zone: 'Thửa Đầm Bông - Cánh đồng Lớn (3.500 m²)',
        lotCode: 'TH-AN-2026-001',
        standard: 'VietGAP • OCOP 4 sao • Không hóa chất cấm',
        photo: 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=600&auto=format&fit=crop&q=80',
        harvestDate: '15/09/2026',
        packDate: '17/09/2026',
        expiryDate: '17/03/2027',
        journey: [
          { time: '06/2026', title: 'Gieo mạ cấy lúa', desc: 'Giống lúa Bắc Thơm số 7 nguyên chủng, cấy thưa dặm dày hợp lý.' },
          { time: '07/2026', title: 'Bón phân hữu cơ', desc: 'Bón phân hữu cơ khoáng vi sinh Quế Lâm, điều tiết nước mương sạch.' },
          { time: '08/2026', title: 'Chăm sóc đòng', desc: 'Kiểm soát sâu bệnh sinh học, đạt tiêu chuẩn VietGAP.' },
          { time: '09/2026', title: 'Thu hoạch máy gặt', desc: 'Thu hoạch bằng máy liên hợp HTX, sấy khô đạt độ ẩm 14%.' },
          { time: '09/2026', title: 'Xay xát & Đóng gói', desc: 'Xát trắng tự nhiên không chất tẩy, đóng túi 5kg có mã QR.' },
        ],
      };

  return (
    <div className="pb-24 bg-slate-50 min-h-screen">
      <Header
        title="Thông tin nguồn gốc"
        voiceText={`Sản phẩm ${productData.name}, sản xuất bởi ${productData.htx}, hộ nông dân ${productData.farmer}. Đạt tiêu chuẩn ${productData.standard}.`}
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
            <p className="text-xs text-emerald-100 font-mono mt-0.5">{code}</p>
          </div>
        </div>

        {/* Product Identity Card */}
        <div className="bg-white rounded-3xl overflow-hidden border-2 border-slate-200 shadow-sm">
          <div className="aspect-video relative bg-slate-100">
            <img
              src={productData.photo}
              alt={productData.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur text-white text-xs px-3 py-1 rounded-full font-bold">
              {productData.standard}
            </div>
          </div>

          <div className="p-5 space-y-3">
            <h2 className="text-2xl font-extrabold text-slate-900 leading-tight">
              {productData.name}
            </h2>

            <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-1 text-sm text-emerald-950">
              <div>• <strong>Hợp tác xã:</strong> {productData.htx}</div>
              <div>• <strong>Địa chỉ:</strong> {productData.location}</div>
              <div>• <strong>Hộ sản xuất:</strong> {productData.farmer}</div>
              <div>• <strong>Vùng trồng:</strong> {productData.zone}</div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500 font-bold block">Ngày thu hoạch:</span>
                <span className="text-sm font-extrabold text-slate-800">{productData.harvestDate}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500 font-bold block">Hạn dùng đến:</span>
                <span className="text-sm font-extrabold text-slate-800">{productData.expiryDate}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Production Timeline Journey */}
        <div className="bg-white rounded-3xl p-5 border-2 border-slate-200 shadow-sm space-y-4">
          <h3 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <span>🌱</span> Hành trình từ đồng ruộng đến bàn ăn
          </h3>

          <div className="relative pl-6 space-y-5 border-l-4 border-emerald-500 ml-3 py-1">
            {productData.journey.map((item, index) => (
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
                navigator.share({ title: productData.name, text: `Truy xuất nguồn gốc ${productData.name}` });
              } else {
                alert('Đã sao chép liên kết chia sẻ Zalo!');
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
