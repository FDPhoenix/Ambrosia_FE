import React, { useState, FormEvent } from "react";
import Cookies from "js-cookie";

const ChangePassword: React.FC = () => {
    const [oldPassword, setOldPassword] = useState<string>("");
    const [newPassword, setNewPassword] = useState<string>("");
    const [confirmPassword, setConfirmPassword] = useState<string>("");

    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string>("");

    const token = Cookies.get("token");

    const validatePassword = (password: string) => {
        if (/\s/.test(password)) return "Password must not contain spaces.";
        if (password.length < 6 || password.length > 16)
            return "Password must be 6-16 characters.";
        if (!/[A-Za-z]/.test(password) || !/\d/.test(password))
            return "Password must contain at least one letter and one number.";
        if (!/[!@#$%^&*()_+\[\]{}|;:'\",.<>?/]/.test(password))
            return "Password must contain at least one special character.";
        return null;
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            setError("New password and confirm password do not match.");
            return;
        }

        const passwordError = validatePassword(newPassword);
        if (passwordError) {
            setError(passwordError);
            return;
        }

        if (oldPassword === newPassword) {
            setError("New password cannot be the same as the old password.");
            return;
        }

        if (!token) {
            setError("No token available, please log in.");
            return;
        }

        setLoading(true);
        setError(null);
        setMessage("");

        try {
            const response = await fetch("http://localhost:3000/user/change-password", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ oldPassword, newPassword }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || "Failed to change password.");
            }

            setMessage("Password changed successfully.");
            setOldPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (err: any) {
            setError(err.message || "An error occurred while changing password.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-[280px] mx-auto p-4 bg-[#d7cfc6] rounded-lg">
            <h2 className="text-center text-[#634a3e] text-[18px] font-semibold mb-4">
                Change Password
            </h2>

            {error && (
                <p className="text-center text-red-600 text-xs mb-2 font-medium">Error: {error}</p>
            )}
            {message && (
                <p className="text-center text-green-600 text-xs mb-2 font-medium">{message}</p>
            )}

            <form onSubmit={handleSubmit}>
                <div className="mb-2">
                    <label className="block text-[#634a3e] font-bold text-[13px] mb-1">
                        Current Password:
                    </label>
                    <input
                        type="password"
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        required
                        className="w-full px-2 py-[5px] h-[30px] text-[12px] border border-[#baa392] rounded bg-[#f4f0eb] focus:outline-none focus:border-[#634a3e] focus:ring-1 focus:ring-[#634a3e]"
                    />
                </div>

                <div className="mb-2">
                    <label className="block text-[#634a3e] font-bold text-[13px] mb-1">
                        New Password:
                    </label>
                    <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        className="w-full px-2 py-[5px] h-[30px] text-[12px] border border-[#baa392] rounded bg-[#f4f0eb] focus:outline-none focus:border-[#634a3e] focus:ring-1 focus:ring-[#634a3e]"
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-[#634a3e] font-bold text-[13px] mb-1">
                        Confirm New Password:
                    </label>
                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="w-full px-2 py-[5px] h-[30px] text-[12px] border border-[#baa392] rounded bg-[#f4f0eb] focus:outline-none focus:border-[#634a3e] focus:ring-1 focus:ring-[#634a3e]"
                    />
                </div>

                <div className="flex justify-center gap-3">
                    <button
                        type="submit"
                        disabled={loading}
                        className={`bg-[#baa392] text-white px-3 py-1 text-[8px] font-semibold rounded-md shadow-sm transition-transform min-w-[80px] ${loading
                            ? "cursor-not-allowed opacity-70"
                            : "hover:bg-[#a89080] hover:-translate-y-0.5"
                            }`}
                    >
                        {loading ? "Changing..." : "Change Password"}
                    </button>


                </div>
            </form>
        </div>
    );
};

export default ChangePassword;
