import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { authFetch } from '../services/api';

export default function EditProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState({
    name: '',
    description: '',
    price: '',
    stock_quantity: '',
    image: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchProduct() {
      try {
        const res = await authFetch(`/products/${id}`);
        if (!res.ok) throw new Error('Failed to fetch product');
        const data = await res.json();
        setProduct({
          name: data.name,
          description: data.description,
          price: data.price,
          stock_quantity: data.stock_quantity,
          image: data.image || ''
        });
      } catch (err) {
        setError(err.message);
      }
    }
    fetchProduct();
  }, [id]);

  const handleChange = e => {
    const { name, value } = e.target;
    setProduct(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = e => {
    if (e.target.files.length > 0) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');

    if (product.price <= 0) {
      setError('Price must be greater than 0');
      return;
    }

    if (product.stock_quantity < 0) {
      setError('Stock quantity cannot be negative');
      return;
    }

    try {
      let imagePath = product.image;

      if (imageFile) {
        const formData = new FormData();
        formData.append('image', imageFile);

        const uploadRes = await authFetch('/uploads', {
          method: 'POST',
          body: formData,
        });

        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error || 'Image upload failed');
        imagePath = uploadData.path;
      }

      const res = await authFetch(`/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...product, image: imagePath }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Update failed');

      navigate('/admin');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Edit Product</h1>
      {error && <p className="text-red-600">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          name="name"
          value={product.name}
          onChange={handleChange}
          placeholder="Name"
          className="w-full p-2 border rounded"
        />
        <textarea
          name="description"
          value={product.description}
          onChange={handleChange}
          placeholder="Description"
          className="w-full p-2 border rounded"
        />
        <input
          name="price"
          type="number"
          step="0.01"
          value={product.price}
          onChange={handleChange}
          placeholder="Price"
          className="w-full p-2 border rounded"
        />
        <input
          name="stock_quantity"
          type="number"
          value={product.stock_quantity}
          onChange={handleChange}
          placeholder="Stock Quantity"
          className="w-full p-2 border rounded"
        />
        <div>
          <label className="block mb-1">Product Image</label>
          <input type="file" accept="image/*" onChange={handleImageChange} />
          {product.image && (
            <img
              src={`http://localhost:3000${product.image}`}
              alt="Product Preview"
              className="mt-2 h-32 object-cover rounded"
            />
          )}
        </div>
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Save Changes
        </button>
      </form>
    </div>
  );
}