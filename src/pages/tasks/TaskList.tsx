import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/Header';
import { ProductionTask } from '../../types';
import { getCycles, getCycleStatusInfo } from '../../utils/productionUtils';

export const TaskList: React.FC = () => {
  const {
    tasks,
    diaries,
    farmZones,
    currentUser,
    currentRole,
    currentHTX,
    currentCoopConfig,
    updateProductionTask,
    createServiceRequestTask,
    navigateTo,
  } = useApp();

  // Nhóm hiển thị: Cần làm, Sắp tới, Đã làm (theo Yêu cầu 2)
  const [activeGroup, setActiveGroup] = useState<'can_lam' | 'sap_toi' | 'da_lam'>('can_lam');
  const [selectedTask, setSelectedTask] = useState<ProductionTask | null>(null);

  // Modal hoàn thành / bổ sung kết quả
  const [showCompleteModal, setShowCompleteModal] = useState<boolean>(false);
  const [completeNotes, setCompleteNotes] = useState<string>('');
  const [completeQty, setCompleteQty] = useState<string>('');
  const [reportedIssue, setReportedIssue] = useState<string>('');
  const [markNeedsMore, setMarkNeedsMore] = useState<boolean>(false);

  // Modal yêu cầu dịch vụ (An Ninh)
  const [showServiceModal, setShowServiceModal] = useState<boolean>(false);
  const [serviceType, setServiceType] = useState<'gat' | 'cay' | 'say' | 'vat_tu'>('gat');
  const [selectedZoneId, setSelectedZoneId] = useState<string>(farmZones[0]?.id || '');
  const [selectedServiceCycleId, setSelectedServiceCycleId] = useState<string>('');
  const [requestedDate, setRequestedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [serviceQty, setServiceQty] = useState<string>('7');
  const [serviceDesc, setServiceDesc] = useState<string>('');

  // Modal biến động đàn & xuất bán (Đông Tảo)
  const [showLivestockModal, setShowLivestockModal] = useState<boolean>(false);
  const [currentBirdCount, setCurrentBirdCount] = useState<string>('495');
  const [sampleWeight, setSampleWeight] = useState<string>('4.2');
  const [deadCount, setDeadCount] = useState<string>('0');
  const [medication, setMedication] = useState<string>('');
  const [symptoms, setSymptoms] = useState<string>('');
  const [isSalesRequest, setIsSalesRequest] = useState<boolean>(false);
  const [salesNotes, setSalesNotes] = useState<string>('');

  // Lọc danh sách công việc theo HTX và vai trò (R06 chỉ thấy việc của mình)
  const htxTasks = tasks.filter((t) => {
    if (t.htxId !== currentHTX.id) return false;
    if (currentRole === 'R06' && currentUser.phone && t.assignedTo !== currentUser.phone) return false;
    return true;
  });

  const todayStr = new Date().toISOString().split('T')[0];

  // Phân nhóm theo 3 nhóm trực quan (Yêu cầu 2)
  const tasksCanLam = htxTasks.filter((t) => {
    if (t.status === 'da_lam' || t.status === 'huy') return false;
    return t.dueDate <= todayStr || t.status === 'tre';
  });

  const tasksSapToi = htxTasks.filter((t) => {
    if (t.status === 'da_lam' || t.status === 'huy') return false;
    return t.dueDate > todayStr && t.status !== 'tre';
  });

  const tasksDaLam = htxTasks.filter((t) => {
    return t.status === 'da_lam' || t.status === 'can_bo_sung';
  });

  const currentDisplayTasks =
    activeGroup === 'can_lam'
      ? tasksCanLam
      : activeGroup === 'sap_toi'
      ? tasksSapToi
      : tasksDaLam;

  // Điều hướng sang màn hình biểu mẫu nhật ký để ghi kết quả (Yêu cầu 3)
  const handleOpenDiaryForTask = (task: ProductionTask) => {
    const zone = farmZones.find((z) => z.id === task.farmZoneId);
    if (zone && (zone.unitStatus === 'tam_ngung' || zone.unitStatus === 'ngung_su_dung' || zone.status === 'tam_ngung')) {
      alert(`Đơn vị sản xuất đang tạm ngừng sử dụng (${zone.statusNote || 'đang sửa chữa, cải tạo'}). Không thể ghi nhật ký.`);
      return;
    }
    if (zone && task.cycleId) {
      const cycle = getCycles(zone).find((c) => (c.cycleId || c.seasonId) === task.cycleId);
      if (cycle?.status === 'da_ket_thuc') {
        alert(`${cycle.seasonName} đã kết thúc. Không thể ghi thêm nhật ký vào chu kỳ đã kết thúc.`);
        return;
      }
      if (cycle?.status === 'du_kien') {
        alert(`${cycle.seasonName} đang ở trạng thái Dự kiến (chưa bắt đầu thực hiện).`);
        return;
      }
    }
    navigateTo('diary_add', {
      taskId: task.id,
      taskTitle: task.title,
      zoneId: task.farmZoneId,
      cycleId: task.cycleId,
      cycleName: task.cycleName,
      taskCategory: task.taskCategory,
      defaultNotes: task.description || '',
      fromTaskList: true,
    });
  };

  // Mở modal xác nhận nhanh hoặc bổ sung kết quả
  const handleOpenCompleteModal = (task: ProductionTask) => {
    setSelectedTask(task);
    setCompleteNotes(task.resultNotes || '');
    setCompleteQty(task.actualQuantity ? String(task.actualQuantity) : '');
    setReportedIssue(task.reportedIssue || '');
    setMarkNeedsMore(task.status === 'can_bo_sung' || Boolean(task.needsAdditionalResult));
    setShowCompleteModal(true);
  };

  const handleConfirmComplete = () => {
    if (!selectedTask) return;
    const newStatus = markNeedsMore ? 'can_bo_sung' : 'da_lam';
    updateProductionTask(selectedTask.id, {
      status: newStatus,
      needsAdditionalResult: markNeedsMore,
      resultNotes: completeNotes || (markNeedsMore ? 'Cần bổ sung thêm thông tin thực tế.' : 'Đã hoàn thành theo kế hoạch.'),
      actualQuantity: completeQty ? parseFloat(completeQty) : selectedTask.actualQuantity,
      reportedIssue: reportedIssue.trim() || undefined,
    });
    setShowCompleteModal(false);
    setSelectedTask(null);
  };

  const handleCreateServiceRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedZoneId) return;
    const result = createServiceRequestTask({
      farmZoneId: selectedZoneId,
      cycleId: selectedServiceCycleId,
      serviceType,
      requestedDate,
      description: serviceDesc,
      quantity: serviceQty ? parseFloat(serviceQty) : undefined,
      unit: serviceType === 'say' ? 'kg thóc' : 'sào',
    });
    if (!result.success) { alert(result.message); return; }
    setShowServiceModal(false);
    setServiceDesc('');
  };

  const handleSaveLivestockLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;

    const birds = parseInt(currentBirdCount, 10) || 0;
    const weight = parseFloat(sampleWeight) || 0;
    const dead = parseInt(deadCount, 10) || 0;

    updateProductionTask(selectedTask.id, {
      livestockLog: {
        currentBirdCount: birds,
        deadOrCulledCount: dead,
        sampleWeightKg: weight,
        medicationUsed: medication || undefined,
        diseaseSymptoms: symptoms || undefined,
        salesRequestStatus: isSalesRequest ? 'cho_duyet' : (selectedTask.livestockLog?.salesRequestStatus || 'chua_yeu_cau'),
        salesRequestNotes: isSalesRequest ? salesNotes : selectedTask.livestockLog?.salesRequestNotes,
      },
      resultNotes: `Cập nhật đàn: ${birds} con, cân mẫu ${weight} kg/con.${dead > 0 ? ` Hao hụt/loại: ${dead} con.` : ''}`,
    });

    setShowLivestockModal(false);
    setSelectedTask(null);
  };

  // Tìm nhật ký liên kết với task để hiển thị nút xem nhật ký
  const getLinkedDiary = (task: ProductionTask) => {
    if (task.diaryId) {
      const match = diaries.find((d) => d.id === task.diaryId);
      if (match) return match;
    }
    return diaries.find((d) => d.taskId === task.id || (d.farmZoneId === task.farmZoneId && d.workTypeName === task.title));
  };

  const getStatusBadge = (task: ProductionTask) => {
    if (task.status === 'can_bo_sung' || task.needsAdditionalResult) {
      return (
        <span className="px-2.5 py-1 bg-amber-100 text-amber-900 text-xs font-black rounded-xl border border-amber-300 flex items-center gap-1 shadow-xs">
          <span>📝</span> Cần bổ sung kết quả
        </span>
      );
    }
    if (task.status === 'da_lam') {
      return (
        <span className="px-2.5 py-1 bg-emerald-100 text-emerald-900 text-xs font-black rounded-xl border border-emerald-300 flex items-center gap-1 shadow-xs">
          <span>✓</span> Đã hoàn thành
        </span>
      );
    }
    if (task.status === 'tre' || (task.status === 'chua_lam' && task.dueDate < todayStr)) {
      return (
        <span className="px-2.5 py-1 bg-red-100 text-red-900 text-xs font-black rounded-xl border border-red-300 flex items-center gap-1 shadow-xs">
          <span>⚠️</span> Quá hạn
        </span>
      );
    }
    if (task.dueDate === todayStr) {
      return (
        <span className="px-2.5 py-1 bg-amber-100 text-amber-900 text-xs font-black rounded-xl border border-amber-300 flex items-center gap-1 shadow-xs">
          <span>⏳</span> Hôm nay
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 bg-blue-100 text-blue-900 text-xs font-black rounded-xl border border-blue-200 flex items-center gap-1 shadow-xs">
        <span>📅</span> Sắp tới
      </span>
    );
  };

  return (
    <div className="pb-24 bg-slate-50 min-h-screen">
      <Header
        title={currentRole === 'R06' ? 'Công việc & nhật ký' : 'Điều phối & Kế hoạch sản xuất'}
        voiceText={
          currentRole === 'R06'
            ? 'Màn hình công việc và nhật ký. Bác có thể xem việc cần làm, việc sắp tới hoặc việc đã làm, và bấm nút lớn Ghi kết quả để ghi nhật ký nhé.'
            : `Kế hoạch sản xuất tại ${currentHTX.name}.`
        }
      />

      <div className="p-4 space-y-4 max-w-lg mx-auto">
        {/* NÚT LỚN GHI VIỆC PHÁT SINH (Yêu cầu 4) */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-800 rounded-3xl p-4 text-white shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs uppercase font-extrabold tracking-wider text-emerald-200">
                {currentHTX.shortName} • {currentRole === 'R06' ? 'Sổ tay của Hộ' : 'Cổng điều phối'}
              </span>
              <h3 className="text-lg font-black mt-0.5">Công việc & Nhật ký sản xuất</h3>
            </div>
            <span className="text-3xl">{currentHTX.logo}</span>
          </div>

          <p className="text-xs text-emerald-100 leading-relaxed">
            Kế hoạch là công việc dự kiến từ HTX. Nhật ký là ghi chép thực tế đã làm để truy xuất VietGAP.
          </p>

          <div className="pt-1 flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => navigateTo('diary_add', { isIncident: true, fromTaskList: true })}
              className="w-full py-3.5 px-4 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm rounded-2xl shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <span className="text-xl">⚡</span>
              <span>Ghi việc phát sinh (ngoài kế hoạch)</span>
            </button>

            {/* Nút tác vụ đặc thù theo HTX */}
            {currentCoopConfig.enableServiceRequest && currentRole === 'R06' && (
              <button
                onClick={() => setShowServiceModal(true)}
                className="py-2.5 px-3 bg-white/20 hover:bg-white/30 text-white text-xs font-extrabold rounded-2xl backdrop-blur-xs transition-all flex items-center justify-center gap-1.5"
              >
                <span>🚜</span> Đăng ký gặt / sấy HTX
              </button>
            )}

            {currentCoopConfig.enableLivestockTracking && (
              <button
                onClick={() => {
                  const dtTask = htxTasks.find((t) => t.livestockLog) || htxTasks[0];
                  if (dtTask) {
                    setSelectedTask(dtTask);
                    setShowLivestockModal(true);
                  }
                }}
                className="py-2.5 px-3 bg-white/20 hover:bg-white/30 text-white text-xs font-extrabold rounded-2xl backdrop-blur-xs transition-all flex items-center justify-center gap-1.5"
              >
                <span>🐓</span> Cập nhật biến động đàn gà
              </button>
            )}
          </div>
        </div>

        {/* 3 NHÓM DỄ HIỂU CHO NGƯỜI LỚN TUỔI (Yêu cầu 2) */}
        <div className="bg-white p-1.5 rounded-3xl border-2 border-slate-200 shadow-sm grid grid-cols-3 gap-1.5">
          <button
            onClick={() => setActiveGroup('can_lam')}
            className={`py-3 px-2 rounded-2xl font-black text-xs sm:text-sm transition-all flex flex-col items-center justify-center gap-1 ${
              activeGroup === 'can_lam'
                ? 'bg-emerald-700 text-white shadow-md scale-[1.02]'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center gap-1">
              <span>⚡ Cần làm</span>
              {tasksCanLam.length > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                    activeGroup === 'can_lam' ? 'bg-amber-400 text-slate-900' : 'bg-red-500 text-white'
                  }`}
                >
                  {tasksCanLam.length}
                </span>
              )}
            </div>
            <span className="text-[10px] font-semibold opacity-90 hidden sm:inline">Hôm nay & trễ hạn</span>
          </button>

          <button
            onClick={() => setActiveGroup('sap_toi')}
            className={`py-3 px-2 rounded-2xl font-black text-xs sm:text-sm transition-all flex flex-col items-center justify-center gap-1 ${
              activeGroup === 'sap_toi'
                ? 'bg-emerald-700 text-white shadow-md scale-[1.02]'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center gap-1">
              <span>📅 Sắp tới</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                  activeGroup === 'sap_toi' ? 'bg-white text-emerald-800' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {tasksSapToi.length}
              </span>
            </div>
            <span className="text-[10px] font-semibold opacity-90 hidden sm:inline">Theo lịch vụ tới</span>
          </button>

          <button
            onClick={() => setActiveGroup('da_lam')}
            className={`py-3 px-2 rounded-2xl font-black text-xs sm:text-sm transition-all flex flex-col items-center justify-center gap-1 ${
              activeGroup === 'da_lam'
                ? 'bg-emerald-700 text-white shadow-md scale-[1.02]'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center gap-1">
              <span>✓ Đã làm</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                  activeGroup === 'da_lam' ? 'bg-white text-emerald-800' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {tasksDaLam.length}
              </span>
            </div>
            <span className="text-[10px] font-semibold opacity-90 hidden sm:inline">Đã ghi kết quả</span>
          </button>
        </div>

        {/* THÔNG BÁO TÌNH TRẠNG NHÓM */}
        {activeGroup === 'can_lam' && tasksCanLam.length === 0 && (
          <div className="bg-emerald-50 border-2 border-emerald-200 rounded-3xl p-6 text-center space-y-2">
            <span className="text-4xl">🎉</span>
            <h4 className="text-base font-black text-emerald-950">Tuyệt vời! Không có việc gấp cần làm ngay</h4>
            <p className="text-xs text-emerald-800 max-w-xs mx-auto">
              Bác đã hoàn thành mọi việc của hôm nay. Hãy bấm sang mục &quot;Sắp tới&quot; để xem trước lịch công việc tiếp theo nhé!
            </p>
            <button
              onClick={() => setActiveGroup('sap_toi')}
              className="mt-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs"
            >
              Xem việc sắp tới ➜
            </button>
          </div>
        )}

        {/* DANH SÁCH CÔNG VIỆC TRONG NHÓM ĐƯỢC CHỌN */}
        {currentDisplayTasks.length > 0 && (
          <div className="space-y-3.5">
            {currentDisplayTasks.map((task) => {
              const linkedDiary = getLinkedDiary(task);

              return (
                <div
                  key={task.id}
                  className={`bg-white rounded-3xl p-4 sm:p-5 border-2 transition-all shadow-sm space-y-3.5 ${
                    task.status === 'da_lam'
                      ? 'border-emerald-200 hover:border-emerald-500'
                      : task.dueDate < todayStr
                      ? 'border-red-200 hover:border-red-400 bg-red-50/20'
                      : 'border-slate-200 hover:border-emerald-500'
                  }`}
                >
                  {/* Dòng 1: Tiêu đề, Đơn vị sản xuất & Trạng thái */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs px-2.5 py-1 bg-slate-100 text-slate-800 font-extrabold rounded-lg">
                          🌾 {task.farmZoneName}
                        </span>
                        {task.cycleName && (
                          <span className="text-xs px-2.5 py-1 bg-emerald-50 text-emerald-800 font-bold rounded-lg border border-emerald-200">
                            {task.cycleName}
                          </span>
                        )}
                      </div>
                      <h4 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                        {task.title}
                      </h4>
                    </div>
                    <div>{getStatusBadge(task)}</div>
                  </div>

                  {/* Mô tả nhiệm vụ kế hoạch */}
                  {task.description && (
                    <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      {task.description}
                    </p>
                  )}

                  {/* Dịch vụ An Ninh nếu có */}
                  {task.serviceRequest && (
                    <div className="bg-amber-50 p-3 rounded-2xl border border-amber-200 text-xs space-y-1">
                      <div className="flex items-center justify-between font-bold text-amber-950">
                        <span>🚜 Dịch vụ HTX: {task.serviceRequest.serviceType.toUpperCase()}</span>
                        <span className="px-2 py-0.5 bg-amber-200 text-amber-900 rounded-md font-extrabold">
                          {task.serviceRequest.status === 'hoan_thanh' ? '✓ Đã xong' : 'Đang điều phối máy'}
                        </span>
                      </div>
                      {task.serviceRequest.machineOperator && (
                        <p className="text-amber-900 font-medium">Tổ máy: {task.serviceRequest.machineOperator}</p>
                      )}
                      {task.serviceRequest.actualQuantity && (
                        <p className="text-amber-900">
                          Thực cấp/thực hiện: <strong>{task.serviceRequest.actualQuantity} {task.serviceRequest.unit}</strong>
                        </p>
                      )}
                    </div>
                  )}

                  {/* Chăn nuôi Đông Tảo nếu có */}
                  {task.livestockLog && (
                    <div className="bg-orange-50 p-3 rounded-2xl border border-orange-200 text-xs space-y-1 text-orange-950">
                      <div className="flex items-center justify-between font-bold">
                        <span>🐓 Đàn gà hiện có: {task.livestockLog.currentBirdCount} con</span>
                        {task.livestockLog.sampleWeightKg && (
                          <span>Cân mẫu: {task.livestockLog.sampleWeightKg} kg/con</span>
                        )}
                      </div>
                      {task.livestockLog.salesRequestStatus === 'cho_duyet' && (
                        <span className="inline-block px-2 py-0.5 bg-orange-200 text-orange-900 font-bold rounded-md">
                          ⏳ Đang chờ Web Portal duyệt xuất bán
                        </span>
                      )}
                    </div>
                  )}

                  {/* Báo sự cố nếu có */}
                  {task.reportedIssue && (
                    <div className="bg-red-50 p-3 rounded-2xl border border-red-200 text-xs text-red-950">
                      <strong>⚠️ Sự cố đã báo:</strong> {task.reportedIssue}
                    </div>
                  )}

                  {/* Kết quả nhật ký đã ghi (Yêu cầu 5) */}
                  {task.resultNotes && (
                    <div className="text-xs text-emerald-950 bg-emerald-50/80 p-3 rounded-2xl border border-emerald-200 space-y-1">
                      <div className="flex items-center justify-between font-bold text-emerald-900">
                        <span>📝 Kết quả thực tế đã làm:</span>
                        {task.completedAt && (
                          <span className="text-[11px] text-slate-500 font-normal">
                            {task.completedAt.slice(0, 10)}
                          </span>
                        )}
                      </div>
                      <p className="font-medium text-slate-800">{task.resultNotes}</p>
                      {task.actualQuantity && (
                        <p className="text-emerald-800 font-bold">
                          Số lượng thực tế: {task.actualQuantity.toLocaleString('vi-VN')} {task.actualUnit || 'kg'}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Thông tin hạn thực hiện */}
                  <div className="flex items-center justify-between pt-1 text-xs text-slate-500 font-semibold">
                    <span>
                      📅 Hạn hoàn thành: <strong className="text-slate-800">{task.dueDate}</strong>
                    </span>
                    <span>Phụ trách: <strong>{task.assigneeName}</strong></span>
                  </div>

                  {/* KHU VỰC HÀNH ĐỘNG RÕ RÀNG THEO YÊU CẦU 3 */}
                  <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
                    {task.status !== 'da_lam' ? (
                      <div className="flex flex-col sm:flex-row gap-2">
                        {/* NÚT LỚN "GHI KẾT QUẢ" (Yêu cầu 3) */}
                        <button
                          onClick={() => handleOpenDiaryForTask(task)}
                          className="flex-1 py-3.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-sm rounded-2xl shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                          <span className="text-lg">📝</span>
                          <span>Ghi kết quả (mở nhật ký)</span>
                        </button>

                        <button
                          onClick={() => handleOpenCompleteModal(task)}
                          className="py-3 px-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-2xl transition-all"
                        >
                          ✓ Xác nhận nhanh
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
                        {/* LIÊN KẾT XEM NHẬT KÝ ĐÃ GHI TƯƠNG ỨNG (Yêu cầu 3) */}
                        {linkedDiary ? (
                          <button
                            onClick={() => navigateTo('diary_detail', { entry: linkedDiary })}
                            className="w-full sm:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all active:scale-95"
                          >
                            <span>📖</span>
                            <span>Xem nhật ký đã ghi ➜</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => navigateTo('diary_list')}
                            className="w-full sm:w-auto px-3.5 py-2 text-emerald-800 hover:underline font-bold text-xs flex items-center justify-center gap-1"
                          >
                            <span>📖</span>
                            <span>Xem trong danh sách nhật ký</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleOpenCompleteModal(task)}
                          className="w-full sm:w-auto px-3 py-2 text-slate-600 hover:text-slate-900 font-bold text-xs underline text-center"
                        >
                          ✏️ Bổ sung kết quả / Báo sự cố
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ĐƯỜNG DẪN XEM TOÀN BỘ SỔ NHẬT KÝ SẢN XUẤT (Không bỏ rơi màn hình cũ - Yêu cầu 7) */}
        <div className="pt-2">
          <button
            onClick={() => navigateTo('diary_list')}
            className="w-full p-4 bg-white rounded-3xl border-2 border-slate-200 hover:border-emerald-600 active:scale-98 transition-all shadow-sm flex items-center justify-between text-left"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl p-2 bg-emerald-100 rounded-2xl text-emerald-800">📖</span>
              <div>
                <h4 className="text-sm font-black text-slate-900">Xem toàn bộ Nhật ký sản xuất</h4>
                <p className="text-xs text-slate-500 font-medium">
                  Xem dòng thời gian {diaries.length} bản ghi nhật ký đã lưu
                </p>
              </div>
            </div>
            <span className="text-slate-400 font-bold text-lg">➔</span>
          </button>
        </div>
      </div>

      {/* MODAL 1: XÁC NHẬN HOÀN THÀNH / BỔ SUNG KẾT QUẢ & BÁO SỰ CỐ (Yêu cầu 5) */}
      {showCompleteModal && selectedTask && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  {selectedTask.status === 'da_lam' ? 'Cập nhật / Bổ sung kết quả' : 'Xác nhận hoàn thành việc'}
                </h3>
                <p className="text-xs text-slate-500 truncate max-w-xs">{selectedTask.title}</p>
              </div>
              <button
                onClick={() => setShowCompleteModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Kết quả thực hiện & Ghi chú thực tế
                </label>
                <textarea
                  value={completeNotes}
                  onChange={(e) => setCompleteNotes(e.target.value)}
                  rows={3}
                  placeholder="Ghi rõ khối lượng, tình trạng lúa/gà/cá hoặc các lưu ý..."
                  className="w-full text-xs p-3 rounded-2xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Số lượng thực tế (kg / con / sào nếu có đo đếm)
                </label>
                <input
                  type="number"
                  value={completeQty}
                  onChange={(e) => setCompleteQty(e.target.value)}
                  placeholder={`Ví dụ: ${selectedTask.actualQuantity || 2000}`}
                  className="w-full text-xs p-3 rounded-2xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none font-bold"
                />
              </div>

              {/* Tùy chọn đánh dấu cần bổ sung kết quả (Yêu cầu 5) */}
              <div className="bg-amber-50 p-3 rounded-2xl border border-amber-200">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={markNeedsMore}
                    onChange={(e) => setMarkNeedsMore(e.target.checked)}
                    className="w-4 h-4 text-amber-600 rounded"
                  />
                  <span className="text-xs font-extrabold text-amber-950">
                    Đánh dấu: Việc này cần bổ sung kết quả sau
                  </span>
                </label>
                <p className="text-[11px] text-amber-800 mt-1 pl-6">
                  Dành cho công việc đã triển khai nhưng chưa cân đo xong hoặc chờ kết quả phân tích.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-red-700 mb-1">
                  Báo sự cố phát sinh (nếu có)
                </label>
                <input
                  type="text"
                  value={reportedIssue}
                  onChange={(e) => setReportedIssue(e.target.value)}
                  placeholder="Ví dụ: Rách mép lưới, sâu rầy mép bờ, chuột phá..."
                  className="w-full text-xs p-3 rounded-2xl border border-red-300 bg-red-50/50 focus:ring-2 focus:ring-red-500 outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowCompleteModal(false)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-2xl transition-all"
              >
                Đóng
              </button>
              <button
                onClick={handleConfirmComplete}
                className="flex-1 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-2xl shadow-md transition-all"
              >
                💾 Lưu kết quả
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: GỬI YÊU CẦU DỊCH VỤ CƠ GIỚI / SẤY (HTX AN NINH) */}
      {showServiceModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateServiceRequest}
            className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">Yêu cầu dịch vụ HTX An Ninh</h3>
                <p className="text-xs text-emerald-700 font-semibold">Tổ máy cơ giới & Lò sấy lúa tập trung</p>
              </div>
              <button
                type="button"
                onClick={() => setShowServiceModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Loại dịch vụ cần hỗ trợ</label>
                <select
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value as any)}
                  className="w-full text-xs p-3 rounded-2xl border border-slate-300 font-bold bg-white"
                >
                  <option value="gat">🚜 Gặt đập liên hợp thu hoạch lúa</option>
                  <option value="say">🔥 Sấy thóc tập trung tại lò sấy HTX</option>
                  <option value="cay">🌱 Cấy máy khay mạ sạch</option>
                  <option value="vat_tu">📦 Đăng ký cấp phát phân bón / giống</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Thửa ruộng đăng ký</label>
                <select
                  value={selectedZoneId}
                  onChange={(e) => setSelectedZoneId(e.target.value)}
                  className="w-full text-xs p-3 rounded-2xl border border-slate-300 font-bold bg-white"
                >
                  {farmZones.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.name} ({z.areaOrQuantity})
                    </option>
                  ))}
                </select>
              </div>
              <label className="block text-xs font-bold text-slate-700">Vụ/lứa đang thực hiện<select className="w-full text-xs p-3 rounded-2xl border border-slate-300" value={selectedServiceCycleId} onChange={(e) => setSelectedServiceCycleId(e.target.value)} required><option value="">Chọn vụ/lứa</option>{getCycles(farmZones.find((zone) => zone.id === selectedZoneId)).filter((cycle) => getCycleStatusInfo(cycle.status).isActive).map((cycle) => <option key={cycle.cycleId || cycle.seasonId} value={cycle.cycleId || cycle.seasonId}>{cycle.seasonName} ({cycle.year})</option>)}</select></label>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Ngày mong muốn</label>
                  <input
                    type="date"
                    value={requestedDate}
                    onChange={(e) => setRequestedDate(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-2xl border border-slate-300 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Diện tích / Số lượng</label>
                  <input
                    type="number"
                    value={serviceQty}
                    onChange={(e) => setServiceQty(e.target.value)}
                    placeholder="VD: 7 sào"
                    className="w-full text-xs p-2.5 rounded-2xl border border-slate-300 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Ghi chú thêm cho tổ máy</label>
                <input
                  type="text"
                  value={serviceDesc}
                  onChange={(e) => setServiceDesc(e.target.value)}
                  placeholder="Ví dụ: Ruộng gần đường lớn, máy dễ vào..."
                  className="w-full text-xs p-3 rounded-2xl border border-slate-300 outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowServiceModal(false)}
                className="flex-1 py-3 bg-slate-100 text-slate-700 font-extrabold text-xs rounded-2xl"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-slate-900 font-black text-xs rounded-2xl shadow-md"
              >
                🚀 Gửi yêu cầu HTX
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 3: BIẾN ĐỘNG ĐÀN & XUẤT BÁN GÀ (ĐÔNG TẢO) */}
      {showLivestockModal && selectedTask && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveLivestockLog}
            className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">Biến động đàn & Xin xuất bán</h3>
                <p className="text-xs text-orange-700 font-semibold">Gà Đông Tảo thuần chủng</p>
              </div>
              <button
                type="button"
                onClick={() => setShowLivestockModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Số con hiện có</label>
                  <input
                    type="number"
                    value={currentBirdCount}
                    onChange={(e) => setCurrentBirdCount(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-2xl border border-slate-300 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Cân mẫu (kg/con)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={sampleWeight}
                    onChange={(e) => setSampleWeight(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-2xl border border-slate-300 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Số chết / loại thải</label>
                <input
                  type="number"
                  value={deadCount}
                  onChange={(e) => setDeadCount(e.target.value)}
                  placeholder="0"
                  className="w-full text-xs p-2.5 rounded-2xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Thuốc / Vắc-xin đã dùng</label>
                <input
                  type="text"
                  value={medication}
                  onChange={(e) => setMedication(e.target.value)}
                  placeholder="Ví dụ: Vắc-xin Lasota, men tiêu hóa..."
                  className="w-full text-xs p-2.5 rounded-2xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Dấu hiệu sức khỏe / Báo bệnh</label>
                <input
                  type="text"
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder="Khỏe mạnh, hoặc ghi triệu chứng ủ rũ, phân trắng..."
                  className="w-full text-xs p-2.5 rounded-2xl border border-slate-300"
                />
              </div>

              <div className="bg-orange-50 p-3 rounded-2xl border border-orange-200 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isSalesRequest}
                    onChange={(e) => setIsSalesRequest(e.target.checked)}
                    className="w-4 h-4 text-orange-600 rounded"
                  />
                  <span className="text-xs font-extrabold text-orange-950">
                    Gửi đề xuất xin xuất bán đàn gà sống
                  </span>
                </label>
                {isSalesRequest && (
                  <input
                    type="text"
                    value={salesNotes}
                    onChange={(e) => setSalesNotes(e.target.value)}
                    placeholder="Ghi chú số lượng cần xuất, thương lái..."
                    className="w-full text-xs p-2 rounded-xl border border-orange-300 bg-white"
                  />
                )}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowLivestockModal(false)}
                className="flex-1 py-3 bg-slate-100 text-slate-700 font-extrabold text-xs rounded-2xl"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="flex-1 py-3 bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs rounded-2xl shadow-md"
              >
                💾 Lưu thông tin
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
