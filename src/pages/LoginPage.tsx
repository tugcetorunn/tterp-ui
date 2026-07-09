import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/authService";

export default function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("admin@test.com");
  const [password, setPassword] = useState("123456");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await authService.login({ email, password });
      const token = result.accessToken ?? result.token;

      if (!token) {
        setError("Token alınamadı. Login response formatını kontrol et.");
        return;
      }

      localStorage.setItem("accessToken", token);
      navigate("/");
    } catch {
      setError("Giriş başarısız. Email, şifre veya API adresini kontrol et.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#111827] flex items-center justify-center px-4">
      <form onSubmit={submit} className="w-full max-w-md bg-white rounded-3xl p-8 shadow-xl">
        <h1 className="text-3xl font-bold text-gray-900">TTERP</h1>
        <p className="text-gray-500 mt-1">ERP yönetim paneline giriş yap</p>

        {error && <div className="mt-5 bg-red-50 text-red-600 p-3 rounded-xl">{error}</div>}

        <div className="mt-6">
          <label className="text-sm font-medium text-gray-700">Email</label>
          <input
            className="mt-2 w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
          />
        </div>

        <div className="mt-4">
          <label className="text-sm font-medium text-gray-700">Şifre</label>
          <input
            className="mt-2 w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
          />
        </div>

        <button
          disabled={loading}
          className="mt-6 w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-60"
        >
          {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
        </button>
      </form>
    </div>
  );
}