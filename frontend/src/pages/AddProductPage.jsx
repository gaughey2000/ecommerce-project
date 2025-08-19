import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { authFetch, API_BASE_URL } from '../services/api';
import { mediaUrl } from '../lib/media';

export default function AddProductPage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    stock_quantity: 0,
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePath, setImagePath] = useState(''); // server path after upload
  const [dragOver, setDragOver] = useState(false);

  function onChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: name === 'stock_quantity' ? Number(value) : value }));
  }

  function onPickFile(e) {
    const file = e.target.files?.[0];
    if (file) validateAndSetFile(file);
  }

  function validateAndSetFile(file) {
    const MAX = 2 * 1024 * 1024; // 2MB
    const okTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!okTypes.includes(file.type)) {
      toast.error('Only JPG, PNG, or WebP images allowed');
      return;
    }
    if (file.size > MAX) {
      toast.error('Image must be ≤ 2MB');
      return;
    }
    setImageFile(file);
  }

  async function uploadImage() {
    if (!imageFile) return null;
    const fd = new FormData();
    fd.append('image', imageFile);

    try {
      const res = await fetch(`${API_BASE_URL}/uploads/products/image`, {
        method: 'POST',
        headers: {
          // Authorization header handled by authFetch; we need it here too:
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Upload failed');
      setImagePath(data.image);
      return data.image; // e.g. "/uploads/1234-file.webp"
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to upload image');
      throw err;
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Name is required');
    if (!form.price || Number(form.price) <= 0) return toast.error('Price must be > 0');
    if (form.stock_quantity < 0) return toast.error('Stock must be ≥ 0');

    setSubmitting(true);
    try {
      // 1) Upload image if selected and not uploaded yet
      let image = imagePath;
      if (imageFile && !imagePath) {
        image = await uploadImage();
      }

      // 2) Create product (backend accepts legacy decimal "price" OR unit_amount)
      const payload = {
        name: form.name.trim(),
        description: form.description?.trim() || null,
        price: String(Number(form.price)), // decimal string
        stock_quantity: Number(form.stock_quantity),
        image: image || null,
      };

      const created = await authFetch('/products', {
        method: 'POST',
        body: JSON.stringify(payload),
      }, true);

      toast.success(`Created "${created?.name}"`);
      navigate('/admin'); // back to dashboard
    } catch (err) {
      // authFetch already toasts; keep console for devs
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  // Drag & drop handlers
  function onDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) validateAndSetFile(file);
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Top bar */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Add New Product</h1>
        <Link
          to="/admin"
          className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300"
        >
          ← Back to Admin
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 shadow-sm space-y-6">
        {/* Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Product name<span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            name="name"
            value={form.name}
            onChange={onChange}
            required
            placeholder="Vintage T-shirt"
            className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={form.description}
            onChange={onChange}
            rows={4}
            placeholder="Soft cotton tee with vintage wash…"
            className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
          <p className="mt-1 text-xs text-gray-500">Optional. At least 5 characters is recommended.</p>
        </div>

        {/* Price & Stock */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700">
              Price (£)<span className="text-red-500">*</span>
            </label>
            <input
              id="price"
              name="price"
              type="number"
              inputMode="decimal"
              min="0.01"
              step="0.01"
              value={form.price}
              onChange={onChange}
              placeholder="19.99"
              className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
          <div>
            <label htmlFor="stock_quantity" className="block text-sm font-medium text-gray-700">
              Stock quantity<span className="text-red-500">*</span>
            </label>
            <input
              id="stock_quantity"
              name="stock_quantity"
              type="number"
              min="0"
              step="1"
              value={form.stock_quantity}
              onChange={onChange}
              className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
        </div>

        {/* Image uploader */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Product image</label>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className={`mt-1 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition
              ${dragOver ? 'border-gray-900 bg-gray-50' : 'border-gray-300 hover:border-gray-400'}`}
          >
            <input
              id="file-input"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={onPickFile}
            />
            <label htmlFor="file-input" className="cursor-pointer">
              <div className="text-sm font-medium text-gray-900">Click to upload</div>
              <div className="mt-1 text-xs text-gray-600">or drag and drop (JPG/PNG/WebP, max 2MB)</div>
            </label>

            {(imageFile || imagePath) && (
              <div className="mt-4 w-full max-w-sm overflow-hidden rounded-xl border border-gray-200">
                <img
                  src={imageFile ? URL.createObjectURL(imageFile) : mediaUrl(imagePath)}
                  alt="Preview"
                  className="h-48 w-full object-cover"
                />
              </div>
            )}
          </div>
          {imagePath && (
            <p className="mt-2 text-xs text-gray-500 break-all">
              Saved path: <span className="font-mono">{imagePath}</span>
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
          <Link
            to="/admin"
            className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className={`inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-medium text-white focus:outline-none focus:ring-2
              ${submitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-gray-900 hover:bg-gray-800 focus:ring-gray-900'}`}
          >
            {submitting ? 'Creating…' : 'Create product'}
          </button>
        </div>
      </form>
    </div>
  );
}