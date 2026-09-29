import React, { useState } from 'react';
import { Header } from '../../components/Header';
import { useApp } from '../../context/AppContext';
import { getCycleTerm, getUnitStatusInfo } from '../../utils/productionUtils';

export const FarmCycleAdd: React.FC = () => {
  const { currentRole, currentHTX, farmZones, screenParams, createProductionCycle, navigateTo, goBack } = useApp();
  const [unitId, setUnitId] = useState<string>(screenParams?.unitId || '');
  const [name, setName] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [variety, setVariety] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [expectedYieldValue, setExpectedYieldValue] = useState('');
  const [stockedQuantity, setStockedQuantity] = useState('');
  const [expectedYieldUnit, setExpectedYieldUnit] = useState('kg');
  const [processVersion, setProcessVersion] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const units = farmZones.filter((unit) => unit.htxId === currentHTX.id && getUnitStatusInfo(unit.unitStatus || unit.status).isAvailable);
  const unit = units.find((item) => item.id === unitId);

  if (currentRole !== 'R03') return <div className="p-6">Không có quyền lập vụ/lứa. <button onClick={goBack}>Quay lại</button></div>;

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!unit) return setError('Chọn nơi sản xuất đang sử dụng thuộc HTX hiện tại.');
    if (stockedQuantity && unit.areaUnit === 'con' && Number(stockedQuantity) > unit.areaValue) return setError('Số con nhập lứa này vượt sức chứa của nơi sản xuất.');
    const result = createProductionCycle(unit.id, {
      seasonName: name.trim(), year, variety: variety.trim(), seasonStartDate: start, seasonEndDate: end,
      expectedYieldValue: expectedYieldValue ? Number(expectedYieldValue) : undefined,
      stockedQuantity: stockedQuantity ? Number(stockedQuantity) : undefined,
      expectedYieldUnit, processVersion: processVersion.trim(), notes: notes.trim(),
    });
    if (!result.success) return setError(result.message || 'Không thể lập vụ/lứa.');
    navigateTo('farm_season_detail', { zoneId: unit.id, seasonId: result.cycle?.cycleId });
  };

  return <div className="pb-24 bg-slate-50 min-h-screen">
    <Header title="Lập vụ/lứa mới" />
    <form onSubmit={submit} className="p-4 space-y-4">
      <label className="block text-sm font-bold">1. Chọn nơi sản xuất<select className="w-full p-3 border rounded-xl mt-1" value={unitId} onChange={(e) => setUnitId(e.target.value)} required><option value="">Chọn nơi sản xuất</option>{units.map((item) => <option key={item.id} value={item.id}>{item.zoneCode} — {item.name} ({getCycleTerm(item)})</option>)}</select></label>
      {unit && <p className="text-sm bg-blue-50 p-3 rounded-xl">{getCycleTerm(unit)} tại {unit.name}. Hộ phụ trách: {unit.ownerName}.</p>}
      <label className="block text-sm font-bold">Tên {getCycleTerm(unit).toLowerCase()}<input className="w-full p-3 border rounded-xl mt-1" value={name} onChange={(e) => setName(e.target.value)} required /></label>
      <label className="block text-sm font-bold">Năm<input type="number" className="w-full p-3 border rounded-xl mt-1" value={year} onChange={(e) => setYear(Number(e.target.value))} required /></label>
      <label className="block text-sm font-bold">Sản phẩm / giống<input className="w-full p-3 border rounded-xl mt-1" value={variety} onChange={(e) => setVariety(e.target.value)} required /></label>
      <div className="grid grid-cols-2 gap-2"><label className="block text-sm font-bold">Bắt đầu dự kiến<input type="date" className="w-full p-3 border rounded-xl mt-1" value={start} onChange={(e) => setStart(e.target.value)} required /></label><label className="block text-sm font-bold">Kết thúc dự kiến<input type="date" className="w-full p-3 border rounded-xl mt-1" value={end} onChange={(e) => setEnd(e.target.value)} required /></label></div>
      <div className="grid grid-cols-2 gap-2"><label className="block text-sm font-bold">Sản lượng dự kiến<input type="number" min="0" step="any" className="w-full p-3 border rounded-xl mt-1" value={expectedYieldValue} onChange={(e) => setExpectedYieldValue(e.target.value)} /></label><label className="block text-sm font-bold">Đơn vị<input className="w-full p-3 border rounded-xl mt-1" value={expectedYieldUnit} onChange={(e) => setExpectedYieldUnit(e.target.value)} /></label></div>
      {unit && ['Chăn nuôi', 'Thủy sản'].includes(unit.productionType) && <label className="block text-sm font-bold">Số con nhập lứa này<input type="number" min="1" step="1" className="w-full p-3 border rounded-xl mt-1" value={stockedQuantity} onChange={(e) => setStockedQuantity(e.target.value)} /><span className="block text-xs text-slate-500">Ghi theo từng lứa, độc lập với sức chứa của chuồng/lồng.</span></label>}
      <label className="block text-sm font-bold">Phiên bản quy trình<input className="w-full p-3 border rounded-xl mt-1" value={processVersion} onChange={(e) => setProcessVersion(e.target.value)} /></label>
      <label className="block text-sm font-bold">Kế hoạch / ghi chú<textarea className="w-full p-3 border rounded-xl mt-1" value={notes} onChange={(e) => setNotes(e.target.value)} /></label>
      {error && <p role="alert" className="text-red-700 text-sm">{error}</p>}
      <button type="submit" className="w-full p-3 bg-blue-700 text-white rounded-xl font-bold">Lưu vụ/lứa dự kiến</button>
    </form>
  </div>;
};
