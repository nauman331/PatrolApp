import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store';
import { fetchAllNFCs } from '@/store/slice/nfc-management/nfcListSlice';
import { deleteNFC, resetDeleteStatus } from '@/store/slice/nfc-management/nfcDeleteSlice';
import { createNFCCheckpoint, resetStatus } from '@/store/slice/nfc-management/nfcSlice';
import { updateNFC } from '@/store/slice/nfc-management/nfcEditsSlice';
import { Plus, Trash2, Edit3, Search, Wifi, X, CheckCircle, Loader2 } from 'lucide-react';

const NFCManagement = () => {
  const dispatch = useDispatch<AppDispatch>();
  
  // Selectors from separate slices
  const { data: list, loading: listLoading } = useSelector((state: RootState) => state.nfcList);
  const { isDeleting, lastDeletedId } = useSelector((state: RootState) => state.nfcDelete);
  const { loading: isCreating, success: createSuccess } = useSelector((state: RootState) => state.nfc);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    tag_uid: '',
    label: '',
    location_description: '',
    is_active: true,
  });

  useEffect(() => {
    dispatch(fetchAllNFCs());
  }, [dispatch, lastDeletedId, createSuccess]);

  const handleEdit = (nfc: any) => {
    setEditingItem(nfc);
    setFormData({
      tag_uid: nfc.tag_uid,
      label: nfc.label,
      location_description: nfc.location_description,
      is_active: nfc.is_active,
    });
    setIsFormOpen(true);
  };

  const handleClose = () => {
    setIsFormOpen(false);
    setEditingItem(null);
    setFormData({ tag_uid: '', label: '', location_description: '', is_active: true });
    dispatch(resetStatus());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) {
      await dispatch(updateNFC({ id: editingItem.id, data: formData }));
    } else {
      await dispatch(createNFCCheckpoint(formData));
    }
    handleClose();
    dispatch(fetchAllNFCs());
  };

  const filteredList = list?.filter(nfc => 
    nfc.label.toLowerCase().includes(searchTerm.toLowerCase()) || 
    nfc.tag_uid.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className=" pb-8 bg-[#F8F9FA] min-h-screen" style={{width:"100%"}}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="font-heading text-4xl font-bold text-ink">NFC Checkpoints</h1>
          {/* <p className="text-gray-500 text-sm">Monitor and manage site hardware assets</p> */}
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text"
              placeholder="Search by label or UID..."
              className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#FF6B00] outline-none w-72 transition-all shadow-sm"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setIsFormOpen(true)}
            className="flex items-center gap-2 bg-[#FF6B00] hover:bg-[#E65F00] text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-orange-100 transition-all active:scale-95"
          >
            <Plus size={20} /> Add New Tag
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-100">
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Tag Details</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Location Context</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredList?.map((nfc) => (
              <tr key={nfc.id} className="hover:bg-orange-50/20 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-orange-100 rounded-xl text-[#FF6B00]">
                      <Wifi size={20} />
                    </div>
                    <div>
                      <div className="font-bold text-gray-800">{nfc.label}</div>
                      <div className="text-xs text-gray-400 font-mono tracking-tight">{nfc.tag_uid}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm text-gray-600 line-clamp-1 max-w-xs">{nfc.location_description}</p>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase ${
                    nfc.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {nfc.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => handleEdit(nfc)}
                      className="p-2  rounded-lg border border-transparent hover:border-gray-200 text-gray-500 hover:text-[#FF6B00] transition-all"
                    >
                      <Edit3 size={18} />
                    </button>
                    <button 
                      onClick={() => dispatch(deleteNFC(nfc.id))}
                      disabled={isDeleting}
                      className="p-2 rounded-lg border border-transparent hover:border-gray-200 text-gray-500 hover:text-red-500 transition-all"
                    >
                      {isDeleting && lastDeletedId === String(nfc.id) ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {listLoading && <div className="p-12 text-center text-gray-400">Loading hardware data...</div>}
      </div>

      {/* Modal Overlay - Centered */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" style={{zIndex: 1000}}>
          <div className="modal-pop w-full max-w-md bg-white shadow-2xl p-10 flex flex-col rounded-2xl" style={{height:"92vh"}}>
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-2xl font-bold text-gray-900">{editingItem ? 'Edit Tag' : 'Register Tag'}</h2>
              <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={24}/></button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6 flex-1">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Unique Tag UID</label>
                <input 
                  required
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 focus:bg-white focus:ring-2 focus:ring-[#FF6B00] outline-none transition-all"
                  value={formData.tag_uid}
                  onChange={(e) => setFormData({...formData, tag_uid: e.target.value})}
                  placeholder="e.g. NFC-987654"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Display Label</label>
                <input 
                  required
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 focus:bg-white focus:ring-2 focus:ring-[#FF6B00] outline-none transition-all"
                  value={formData.label}
                  onChange={(e) => setFormData({...formData, label: e.target.value})}
                  placeholder="e.g. Warehouse A Entrance"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Location Description</label>
                <textarea 
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 focus:bg-white focus:ring-2 focus:ring-[#FF6B00] outline-none transition-all"
                  value={formData.location_description}
                  onChange={(e) => setFormData({...formData, location_description: e.target.value})}
                  placeholder="Describe where the physical tag is mounted..."
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                <span className="text-sm font-bold text-gray-700">Active Status</span>
                <button
                  type="button"
                  onClick={() => setFormData({...formData, is_active: !formData.is_active})}
                  className={`w-12 h-6 rounded-full transition-colors relative ${formData.is_active ? 'bg-[#FF6B00]' : 'bg-gray-300'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.is_active ? 'left-7' : 'left-1'}`} />
                </button>
              </div>

              <button 
                type="submit"
                disabled={isCreating}
                className="w-full bg-[#FF6B00] text-white py-4 rounded-2xl font-bold shadow-xl shadow-orange-100 hover:bg-[#E65F00] transition-all flex items-center justify-center gap-3 mt-8"
              >
                {isCreating ? <Loader2 className="animate-spin" /> : editingItem ? 'Save Changes' : 'Register Checkpoint'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default NFCManagement;