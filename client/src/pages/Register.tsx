import { ChangeEvent, useState } from 'react';
import { UserData, UserRoles } from '../interfaces/user';
import { useNavigate } from 'react-router-dom';
import { APIURL } from '../environments/env';


const RegisterUser = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState<UserData>({
    name: '',
    surname: '',
    company: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    selectedPackage: '',
  });

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePackageSelect = (pkg: string) => {
    setFormData((prev) => ({ ...prev, selectedPackage: pkg }));
  };

  const handleSubmit = async () => {
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match");
      return;
    }
  
    const payload = {
      name: formData.name,
      surname: formData.surname,
      company: formData.company,
      email: formData.email,
      phone: formData.phone,
      password: formData.password,
      role: UserRoles.ADMIN,
      confirmPassword: formData.confirmPassword,
      packageId: formData.selectedPackage,
    };
  
    try {
      const res = await fetch(`${APIURL}/api/users/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
  
      const data = await res.json();
  
      if (res.ok) {
        alert("Registration successful!");
        navigate('/login');            
      } else {
        alert(data.message || "Registration failed");
      }
    } catch (err) {
      console.error("Error:", err);
      alert("Something went wrong");
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 px-8 py-10">
      {/* Step 1 */}
      <div className="bg-white rounded-xl shadow p-8 mb-10">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Basic Info</h2>
          <span className="text-gray-400 text-sm">Step 1 of 2</span>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm mb-1">Name</label>
            <input name="name" value={formData.name} onChange={handleInputChange} className="w-full p-3 border border-gray-200 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm mb-1">Surname</label>
            <input name="surname" value={formData.surname} onChange={handleInputChange} className="w-full p-3 border border-gray-200 rounded-lg" />
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-sm mb-1">Company Name (if applicable)</label>
          <input name="company" value={formData.company} onChange={handleInputChange} className="w-full p-3 border border-gray-200 rounded-lg" />
        </div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm mb-1">Email Address</label>
            <input name="email" type="email" value={formData.email} onChange={handleInputChange} className="w-full p-3 border border-gray-200 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm mb-1">Telephone Number</label>
            <input name="phone" value={formData.phone} onChange={handleInputChange} className="w-full p-3 border border-gray-200 rounded-lg" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">Password</label>
            <input name="password" type="password" value={formData.password} onChange={handleInputChange} className="w-full p-3 border border-gray-200 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm mb-1">Confirm Password</label>
            <input name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleInputChange} className="w-full p-3 border border-gray-200 rounded-lg" />
          </div>
        </div>
      </div>

      {/* Step 2 */}
      <div className="bg-white rounded-xl shadow p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Select Package</h2>
          <span className="text-gray-400 text-sm">Step 2 of 2</span>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              id: 'ignite',
              name: 'Ignite',
              price: 'FREE',
              desc: 'Great Starter!',
              features: ['All analytics features', 'Up to 250,000 tracked visits', 'Normal support', 'Up to 3 team members'],
              style: 'border border-gray-200',
            },
            {
              id: 'catalyst',
              name: 'Catalyst',
              price: '$179 /monthly',
              desc: 'Getting There!',
              features: ['All analytics features', 'Up to 1,000,000 tracked visits', 'Premium support', 'Up to 10 team members'],
              style: 'bg-blue-600 text-white',
              popular: true,
            },
            {
              id: 'summit',
              name: 'Summit',
              price: '$250 /monthly',
              desc: 'Pro Event Managers',
              features: ['All analytics features', 'Up to 250,000 tracked visits', 'Normal support', 'Up to 3 team members'],
              style: 'border border-gray-200',
            },
          ].map((pkg) => (
            <div
              key={pkg.id}
              className={`rounded-xl p-6 cursor-pointer transition transform hover:scale-105 ${pkg.style} ${formData.selectedPackage === pkg.id ? 'ring-4 ring-blue-400' : ''}`}
              onClick={() => handlePackageSelect(pkg.id)}
            >
              {pkg.popular && <div className="text-xs bg-white text-blue-600 px-2 py-1 rounded-full mb-2 inline-block">Popular</div>}
              <h3 className="text-lg font-semibold mb-2">{pkg.desc}</h3>
              <h2 className="text-2xl font-bold mb-2">{pkg.name}</h2>
              <p className="mb-4">{pkg.price}</p>
              <ul className="mb-4 space-y-1 text-sm">
                {pkg.features.map((f, i) => (
                  <li key={i} className="flex items-center">
                    ✅ <span className="ml-2">{f}</span>
                  </li>
                ))}
              </ul>
              <button className="w-full py-2 rounded-lg bg-white text-blue-600 font-semibold">Get started</button>
            </div>
          ))}
        </div>

        <div className="mt-8">
          <button
            onClick={handleSubmit}
            className="w-full py-3 rounded-lg bg-blue-600 text-white font-semibold"
          >
            Complete Registration
          </button>
        </div>
      </div>
    </div>
  );
};

export default RegisterUser;
