import React, { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/Header';
import { FarmZone } from '../../types';

const facilityOptions: Record<FarmZone['productionType'], { value: NonNullable<FarmZone['facilityType']>; label: string }[]> = {
  'Trồng trọt': [{ value: 'thua_ruong', label: 'Thửa ruộng' }, { value: 'vuon_cay', label: 'Vườn cây' }],
  'Cây ăn quả': [{ value: 'vuon_cay', label: 'Vườn cây' }],
  'Chăn nuôi': [{ value: 'chuong_nuoi', label: 'Chuồng nuôi' }],
  'Thủy sản': [{ value: 'ao_nuoi', label: 'Ao nuôi' }, { value: 'long_ca', label: 'Lồng/bè cá' }],
};

export const FarmAdd: React.FC = () => {
  const { currentHTX, currentRole, members, farmZones, addFarmZone, goBack } = useApp();
  const owners = useMemo(() => members.filter((m) => m.htxId === currentHTX.id && m.status === 'active'), [members, currentHTX.id]);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [productionType, setProductionType] = useState<FarmZone['productionType']>('Trồng trọt');
  const [facilityType, setFacilityType] = useState<NonNullable<FarmZone['facilityType']>>('thua_ruong');
  const [ownerId, setOwnerId] = useState('');
  const [location, setLocation] = useState('');
  const [areaValue, setAreaValue] = useState('');
  const [areaUnit, setAreaUnit] = useState('m²');
  const [condition, setCondition] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  if (currentRole !== 'R03') return <div className="p-6">Không có quyền tạo nơi sản xuất. <button onClick={goBack}>Quay lại</button></div>;

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const owner = owners.find((m) => m.id === ownerId);
    if (!owner) return setError('Vui lòng chọn hộ phụ trách thuộc HTX hiện tại.');
    if (farmZones.some((z) => z.zoneCode.toLowerCase() === code.trim().toLowerCase())) return setError('Mã nơi sản xuất đã tồn tại.');
    const result = addFarmZone({
      htxId: currentHTX.id, zoneCode: code.trim(), name: name.trim(), productionType, facilityType,
      ownerId: owner.id, ownerName: owner.name, location: location.trim(),
      areaValue: Number(areaValue), areaUnit, areaOrQuantity: `${areaValue} ${areaUnit}`,
      soilOrWaterCondition: condition.trim(), notes: notes.trim(),
      imageUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600',
      status: 'dang_su_dung', unitStatus: 'dang_su_dung', seasonHistory: [], cycles: [],
    });
    if (!result.success) return setError(result.message || 'Không thể tạo nơi sản xuất.');
    alert('Đã tạo nơi sản xuất. Bạn có thể lập vụ/lứa khi có kế hoạch.');
    goBack();
  };

  return <div className="pb-24 bg-slate-50 min-h-screen">
    <Header title="Tạo nơi sản xuất" />
    <form onSubmit={submit} className="p-4 space-y-4">
      <p className="text-sm text-slate-600">Khai báo thông tin cố định của thửa, vườn, chuồng, ao hoặc lồng. Vụ/lứa được lập riêng sau.</p>
      <label className="block text-sm font-bold">Tên nơi sản xuất<input className="w-full p-3 border rounded-xl mt-1" value={name} onChange={(e) => setName(e.target.value)} required /></label>
      <label className="block text-sm font-bold">Mã nơi sản xuất<input className="w-full p-3 border rounded-xl mt-1" value={code} onChange={(e) => setCode(e.target.value)} required /></label>
      <label className="block text-sm font-bold">Loại hình sản xuất<select className="w-full p-3 border rounded-xl mt-1" value={productionType} onChange={(e) => { const type = e.target.value as FarmZone['productionType']; setProductionType(type); setFacilityType(facilityOptions[type][0].value); setAreaUnit(type === 'Chăn nuôi' ? 'con' : 'm²'); }}>
        {Object.keys(facilityOptions).map((type) => <option key={type}>{type}</option>)}
      </select></label>
      <label className="block text-sm font-bold">Loại nơi sản xuất<select className="w-full p-3 border rounded-xl mt-1" value={facilityType} onChange={(e) => setFacilityType(e.target.value as NonNullable<FarmZone['facilityType']>)}>
        {facilityOptions[productionType].map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select></label>
      <label className="block text-sm font-bold">Hộ phụ trách<select className="w-full p-3 border rounded-xl mt-1" value={ownerId} onChange={(e) => setOwnerId(e.target.value)} required><option value="">Chọn hộ</option>{owners.map((owner) => <option key={owner.id} value={owner.id}>{owner.name}</option>)}</select></label>
      <label className="block text-sm font-bold">Vị trí / địa chỉ<input className="w-full p-3 border rounded-xl mt-1" value={location} onChange={(e) => setLocation(e.target.value)} /></label>
      <div className="grid grid-cols-2 gap-2"><label className="block text-sm font-bold">{productionType === 'Chăn nuôi' ? 'Sức chứa chuồng' : 'Diện tích / sức chứa'}<input type="number" min="0.01" step="any" className="w-full p-3 border rounded-xl mt-1" value={areaValue} onChange={(e) => setAreaValue(e.target.value)} required /></label><label className="block text-sm font-bold">Đơn vị<input className="w-full p-3 border rounded-xl mt-1" value={areaUnit} onChange={(e) => setAreaUnit(e.target.value)} required /></label></div>
      {productionType === 'Chăn nuôi' && <p className="text-xs text-slate-600">Sức chứa chuồng là cố định. Số con thực nhập được ghi cho từng lứa nuôi.</p>}
      <label className="block text-sm font-bold">Điều kiện đất / nguồn nước<input className="w-full p-3 border rounded-xl mt-1" value={condition} onChange={(e) => setCondition(e.target.value)} /></label>
      <label className="block text-sm font-bold">Ghi chú<textarea className="w-full p-3 border rounded-xl mt-1" value={notes} onChange={(e) => setNotes(e.target.value)} /></label>
      {error && <p role="alert" className="text-red-700 text-sm">{error}</p>}
      <button className="w-full p-3 bg-emerald-700 text-white rounded-xl font-bold" type="submit">Lưu nơi sản xuất</button>
    </form>
  </div>;
};
