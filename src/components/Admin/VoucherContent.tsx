import { useCallback, useEffect, useState } from 'react'
import { toast } from 'react-toastify';
import { FaEdit, FaTimes } from 'react-icons/fa';
import StatusBadge from './StatusBadge';
import Pagination from '../Pagination';
import LoadingAnimation from '../LoadingAnimation';

function VoucherContent() {
  const [voucher, setVoucher] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editVoucher, setEditVoucher] = useState<any | null>(null);
  const [currentVoucher, setCurrentVoucher] = useState<any[]>([]);
  const [fetching, isFetching] = useState(false);
  const itemsPerPage = 6;
  const [currentPage, setCurrentPage] = useState<number>(1);
  const backendApiUrl = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3000';

  const [formData, setFormData] = useState({
    code: '',
    discount: '',
    expiresAt: '',
    isUsed: false,
  });

  const fetchVoucher = () => {
    isFetching(true); // Bật trạng thái fetching

    fetch(`${backendApiUrl}/vouchers`)
      .then((res) => res.json())
      .then((response) => {
        if (response.success) {
          setVoucher(response.data);
        } else {
          toast.error(response.message);
        }
      })
      .catch((err) => {
        console.error('Error fetching voucher:', err);
        toast.error('Error fetching vouchers!');
      })
      .finally(() => {
        isFetching(false);
      });

  };

  useEffect(() => {
    fetchVoucher();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'isUsed') {
      setFormData((prev) => ({
        ...prev,
        [name]: value === 'true',
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const method = editVoucher ? 'PUT' : 'POST';
    const url = editVoucher
      ? `${backendApiUrl}/vouchers/${editVoucher._id}`
      : `${backendApiUrl}/vouchers`;

    if (!formData.code || !formData.discount || !formData.expiresAt) {
      toast.error("Mising required field")
      setLoading(false)
      return;
    }

    fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: formData.code,
        discount: Number(formData.discount),
        expiresAt: formData.expiresAt,
        isUsed: formData.isUsed,
      }),
    })
      .then((res) => res.json())
      .then((response) => {
        if (response.success) {
          toast.success(editVoucher ? 'Voucher updated successfully!' : 'Voucher added successfully!');
          fetchVoucher();
          setShowForm(false);
          setEditVoucher(null);
          setFormData({ code: '', discount: '', expiresAt: '', isUsed: false });
        } else {
          toast.error(response.message);
        }
      })
      .catch((err) => {
        console.error('Error:', err);
        toast.error('Error, please try again!');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleEdit = (voucher: any) => {
    setEditVoucher(voucher);
    setFormData({
      code: voucher.code,
      discount: voucher.discount.toString(),
      expiresAt: new Date(voucher.expiresAt).toISOString().split('T')[0],
      isUsed: voucher.isUsed,
    });
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditVoucher(null);
    setFormData({ code: '', discount: '', expiresAt: '', isUsed: false });
  };

  const handlePageChange = useCallback((paginatedVoucher: any[], page: number) => {
    setCurrentVoucher(paginatedVoucher);
    setCurrentPage(page);
  }, []);

  return (
    <div className="relative w-[1200px] max-w-[1210px] h-[567px] p-5 bg-white rounded-2xl shadow-md">
      {fetching ? (
        <div className='w-full h-[567px] flex justify-center items-center'>
          <LoadingAnimation className='scale-150' />
        </div>
      ) : (
        <div>
          <div className="flex justify-between mb-4">
            <h3 className="my-auto text-xl font-semibold">List of Voucher</h3>
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-[7px] text-sm rounded border border-gray-300 bg-[#f0f0f0] hover:bg-[#F0924C] hover:text-white transition duration-200 shadow-sm"
            >
              Add voucher
            </button>
          </div>

          <div className="max-h-[475px] overflow-y-auto [&::-webkit-scrollbar]:w-0">
            <table className="w-full border-collapse text-left">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-4 text-center">No</th>
                  <th className="p-4 text-center">Code</th>
                  <th className="p-4 text-center">Discount (%)</th>
                  <th className="p-4 text-center">Expires Time</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-center">Action</th>
                </tr>
              </thead>

              <tbody>
                {currentVoucher.map((voucher, index) => (
                  <tr key={voucher._id} className="border-b border-gray-200 last:border-b-0">
                    <td className="p-4 text-center">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                    <td className="p-4 text-center">{voucher.code}</td>
                    <td className="p-4 text-center">{voucher.discount}</td>
                    <td className="p-4 text-center">{new Date(voucher.expiresAt).toISOString().split('T')[0]}</td>
                    <td className="p-4 text-center">
                      <div className="w-[106px] mx-auto">
                        <StatusBadge status={!voucher.isUsed} caseTrue={"Available"} caseFalse={"Unavailable"} />
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <button
                        className="text-xl bg-none border-none cursor-pointer mr-2.5 hover:scale-110 hover:text-[#F0924C] transition-transform duration-200"
                        onClick={() => handleEdit(voucher)}
                      >
                        <FaEdit />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination items={voucher} itemsPerPage={itemsPerPage} onPageChange={handlePageChange} />
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center">
          <div className="bg-white w-[400px] p-5 rounded-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">{editVoucher ? 'Edit Voucher' : 'Add New Voucher'}</h3>
              <button onClick={handleCloseForm} className="text-lg bg-none border-none cursor-pointer">
                <FaTimes />
              </button>
            </div>

            <div className="flex flex-col gap-5">
              <form onSubmit={handleSubmit}>
                <div className="w-full">
                  <label htmlFor="code" className="text-sm ml-0.5">Voucher code</label>
                  <input
                    type="text"
                    name="code"
                    id="code"
                    value={formData.code}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md mt-1 mb-4"
                  />

                  <label htmlFor="discount" className="text-sm ml-0.5">Discount</label>
                  <input
                    type="number"
                    name="discount"
                    id="discount"
                    value={formData.discount}
                    onChange={handleInputChange}
                    min="0"
                    max="100"
                    className="w-full p-2 border border-gray-300 rounded-md mt-1 mb-4 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />

                  {editVoucher ? (
                    <div>
                      <label htmlFor="isUsed" className="text-sm ml-0.5">Status</label>
                      <select
                        name="isUsed"
                        id="isUsed"
                        value={formData.isUsed.toString()}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-md mt-1 mb-4"
                      >
                        <option value="false">Available</option>
                        <option value="true">Unavailable</option>
                      </select>
                    </div>
                  ) : null}

                  <label htmlFor="expiresAt" className="text-sm ml-0.5">Expires Time</label>
                  <input
                    type="date"
                    name="expiresAt"
                    id="expiresAt"
                    value={formData.expiresAt}
                    onChange={handleInputChange}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full p-3 border border-gray-300 rounded-md mt-1 mb-4"
                  />

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#F0924C] text-white p-2.5 rounded-md hover:bg-[#D87C3B] transition-colors duration-200 mt-1"
                  >
                    {loading
                      ? editVoucher
                        ? 'Editing...'
                        : 'Adding...'
                      : editVoucher
                        ? 'Edit Voucher'
                        : 'Add Voucher'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default VoucherContent