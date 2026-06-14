"use client";

import { ShieldCheck } from "lucide-react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

export function LoginForm() {
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const result = await signIn("credentials", {
      username,
      password,
      redirect: false,
      callbackUrl: searchParams.get("callbackUrl") ?? "/dashboard"
    });

    setLoading(false);

    if (!result?.ok) {
      setMessage("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
      return;
    }

    window.location.assign(result.url ?? "/dashboard");
  }

  return (
    <form onSubmit={submit} className="card w-full max-w-md p-8">
      <div className="mb-6 flex items-center gap-3">
        <ShieldCheck className="text-[#123f76]" />
        <div>
          <h2 className="text-2xl font-black">เข้าสู่ระบบ</h2>
          <p className="text-sm text-[#667085]">กรอกชื่อผู้ใช้และรหัสผ่านของคุณ</p>
        </div>
      </div>

      <label className="mb-2 block text-sm font-bold">ชื่อผู้ใช้</label>
      <input
        name="username"
        className="mb-4 h-11 w-full rounded-md border border-[#d8d1c1] px-3"
        placeholder="ชื่อผู้ใช้"
        value={username}
        onChange={(event) => setUsername(event.target.value)}
        autoComplete="username"
      />

      <label className="mb-2 block text-sm font-bold">รหัสผ่าน</label>
      <input
        name="password"
        type="password"
        className="mb-4 h-11 w-full rounded-md border border-[#d8d1c1] px-3"
        placeholder="รหัสผ่าน"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        autoComplete="current-password"
      />

      {message ? <p className="mb-4 rounded-md bg-[#fff1f3] px-3 py-2 text-sm font-bold text-[#b91528]">{message}</p> : null}

      <button
        type="submit"
        disabled={loading}
        className="h-11 w-full rounded-md bg-[#b68a2e] font-bold text-white transition hover:bg-[#a47925] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
      </button>
    </form>
  );
}
