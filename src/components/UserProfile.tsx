import React, { useEffect, useState, FormEvent, ChangeEvent } from "react";
import Cookies from 'js-cookie';
import ViewRanks from "./ViewRanks";
import { toast } from "react-toastify";
const backendApiUrl = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3000';

interface UserProfileData {
    fullname: string;
    email: string;
    phoneNumber?: string;
    profileImage?: string;
    rank: string;
    createdAt: string;
}

interface EditProfileProps {
    onChangePasswordClick: () => void;
    onBackClick: () => void;
    isChangePassword?: boolean;
    currentView?: string;
}

const EditProfile: React.FC<EditProfileProps> = ({ onChangePasswordClick, onBackClick, isChangePassword = false, currentView }) => {
    const [profile, setProfile] = useState<UserProfileData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [isViewingRank, setIsViewingRank] = useState<boolean>(false);
    const [message, setMessage] = useState<string>("");

    const [editFullname, setEditFullname] = useState<string>("");
    const [editPhoneNumber, setEditPhoneNumber] = useState<string>("");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>("");
    const [selectedFileName, setSelectedFileName] = useState<string>("");

    const [fullnameError, setFullnameError] = useState<string>("");
    const [phoneError, setPhoneError] = useState<string>("");

    const token = Cookies.get("token");

    useEffect(() => {
        setIsEditing(false);
        setIsViewingRank(false);
    }, [isChangePassword]);

    useEffect(() => {
        if (currentView === "main") {
            setIsEditing(false);
            setIsViewingRank(false);
        }
    }, [currentView]);

    useEffect(() => {
        setIsEditing(false);
        setIsViewingRank(false);
    }, []);

    useEffect(() => {
        if (!token) {
            setError("No token available, please log in.");
            setLoading(false);
            return;
        }

        const fetchProfile = async () => {
            try {
                const response = await fetch(`${backendApiUrl}/user/profile`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    throw new Error("Error fetching profile data!");
                }

                const data = await response.json();
                setProfile(data.user);
                setEditFullname(data.user.fullname);
                setEditPhoneNumber(data.user.phoneNumber || "");
                setPreviewUrl(data.user.profileImage || "");
            } catch (err: any) {
                setError(err.message || "An unknown error occurred.");
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [token]);

    const validateFullname = (name: string): string => {
        const regex = /^[A-Za-zÀ-Ỹà-ỹ]+(?:\s[A-Za-zÀ-Ỹà-ỹ]+)*$/;
        if (!regex.test(name.trim())) {
            return "Full Name must be 2-16 characters, only letters & spaces, with no leading/trailing spaces.";
        }
        if (name.trim().length < 2 || name.trim().length > 16) {
            return "Full Name must be between 2 and 16 characters.";
        }
        return "";
    };

    const validatePhoneNumber = (phone: string): string => {
        const regex = /^(03|05|07|08|09)[0-9]{8}$/;
        if (!regex.test(phone)) {
            return "Phone Number must be 10 digits and start with 03x, 05x, 07x, 08x, or 09x.";
        }
        return "";
    };

    const handleFullnameChange = (e: ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setEditFullname(value);
        setFullnameError(validateFullname(value));
    };

    const handlePhoneNumberChange = (e: ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setEditPhoneNumber(value);
        setPhoneError(validatePhoneNumber(value));
    };

    const handleEditToggle = () => setIsEditing(true);

    const handleCancelEdit = () => {
        if (profile) {
            setEditFullname(profile.fullname);
            setEditPhoneNumber(profile.phoneNumber || "");
            setPreviewUrl(profile.profileImage || "");
            setImageFile(null);
            setSelectedFileName("");
        }
        setIsEditing(false);
    };

    const handleCancelChangePassword = () => {
        onBackClick();
    };

    const handleCancelViewRank = () => {
        setIsViewingRank(false);
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            setImageFile(file);
            setPreviewUrl(URL.createObjectURL(file));
            setSelectedFileName(file.name);
        }
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!token) {
            setError("No token available, please log in.");
            return;
        }

        const finalFullnameError = validateFullname(editFullname);
        const finalPhoneError = validatePhoneNumber(editPhoneNumber);
        setFullnameError(finalFullnameError);
        setPhoneError(finalPhoneError);
        if (finalFullnameError || finalPhoneError) {
            return;
        }

        setLoading(true);
        setError(null);
        setMessage("");

        try {
            let imageUrl = previewUrl;
            if (imageFile) {
                const formData = new FormData();
                formData.append("image", imageFile);
                const uploadResponse = await fetch(`${backendApiUrl}/user/upload-profile-image`, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    body: formData,
                });
                const uploadResult = await uploadResponse.json();
                if (!uploadResponse.ok) {
                    throw new Error(uploadResult.message || "Failed to upload image.");
                }
                imageUrl = uploadResult.profileImage;
            }

            const updateResponse = await fetch(`${backendApiUrl}/user/profile`, {
                headers: {
                    method: "PUT",
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    fullname: editFullname,
                    phoneNumber: editPhoneNumber,
                    profileImage: imageUrl,
                    rank: profile?.rank,
                }),
            });

            const updateResult = await updateResponse.json();
            if (!updateResponse.ok) {
                throw new Error(updateResult.message || "Failed to update profile.");
            }

            setProfile((prevProfile) => ({
                ...prevProfile!,
                ...updateResult.user,
            }));

            setMessage("Profile updated successfully.");
            setIsEditing(false);

            await fetchProfile();
        } catch (err: any) {
            setError(err.message || "An error occurred while updating profile.");
        } finally {
            setLoading(false);
        }
    };

    const fetchProfile = async () => {
        if (!token) {
            setError("No token available, please log in.");
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(`${backendApiUrl}/user/profile`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error("Error fetching profile data!");
            }

            const data = await response.json();
            setProfile(data.user);
            setEditFullname(data.user.fullname);
            setEditPhoneNumber(data.user.phoneNumber || "");
            setPreviewUrl(data.user.profileImage || "");
        } catch (err: any) {
            setError(err.message || "An unknown error occurred.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, [token]);

    const handleChangePasswordClick = () => {
        onChangePasswordClick();
    };

    const handleViewRankClick = () => {
        setIsViewingRank(true);
    };

    if (loading) return <div>Loading profile...</div>;
    if (error) return <div>Error: {error}</div>;
    if (!profile) return <div>No profile data available.</div>;

    return (
        <div className="w-full max-w-[280px] mx-auto p-5 bg-[#f5f1ea] rounded-lg shadow-none text-[#634a3e] text-sm relative">
            {isChangePassword ? (
                <>
                    <button
                        onClick={handleCancelChangePassword}
                        className="absolute top-0 left-0 px-4 py-2 text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
                    >
                        <span>⬅</span> Back
                    </button>
                    <div>
                        <h2 className="mt-3 text-[18px] font-bold text-[#634a3e] text-center mb-[15px] pb-2 relative after:content-[''] after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-10 after:h-[2px] after:bg-[#baa392] after:rounded">
                            Change Password
                        </h2>
                        <form
                            onSubmit={async (e: FormEvent<HTMLFormElement>) => {
                                e.preventDefault();
                                const oldPassword = (e.currentTarget.elements.namedItem('oldPassword') as HTMLInputElement).value;
                                const newPassword = (e.currentTarget.elements.namedItem('newPassword') as HTMLInputElement).value;
                                const confirmPassword = (e.currentTarget.elements.namedItem('confirmPassword') as HTMLInputElement).value;

                                if (newPassword !== confirmPassword) {
                                    setError("New password and confirm password do not match.");
                                    return;
                                }

                                const passwordError = (password: string) => {
                                    if (/\s/.test(password)) return "Password must not contain spaces.";
                                    if (password.length < 6 || password.length > 16) return "Password must be 6-16 characters.";
                                    if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return "Password must contain at least one letter and one number.";
                                    if (!/[!@#$%^&*()_+\[\]{}|;:'\",.<>?/]/.test(password)) return "Password must contain at least one special character.";
                                    return null;
                                };

                                const errorMsg = passwordError(newPassword);
                                if (errorMsg) {
                                    setError(errorMsg);
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
                                    const response = await fetch(`${backendApiUrl}/user/change-password`, {
                                        method: "PUT",
                                        headers: {
                                            "Content-Type": "application/json",
                                            Authorization: `Bearer ${token}`,
                                        },
                                        body: JSON.stringify({ oldPassword, newPassword }),
                                    });

                                    const data = await response.json();
                                    if (!response.ok) {
                                        toast.error(data.message || "Failed to change password.");
                                        return;
                                    }

                                    setMessage("Password changed successfully.");
                                } catch (err: any) {
                                    setError(err.message || "An error occurred while changing password.");
                                } finally {
                                    setLoading(false);
                                }
                            }}
                        >
                            {error && <p className="text-red-600 text-xs mb-2">{error}</p>}
                            {message && <p className="text-green-600 text-xs mb-2">{message}</p>}

                            <div className="mb-2">
                                <label className="block font-semibold mb-1">Current Password:</label>
                                <input type="password" name="oldPassword" required className="w-full p-2 border border-[#baa392] rounded-md text-sm" />
                            </div>
                            <div className="mb-2">
                                <label className="block font-semibold mb-1">New Password:</label>
                                <input type="password" name="newPassword" required className="w-full p-2 border border-[#baa392] rounded-md text-sm" />
                            </div>
                            <div className="mb-4">
                                <label className="block font-semibold mb-1">Confirm New Password:</label>
                                <input type="password" name="confirmPassword" required className="w-full p-2 border border-[#baa392] rounded-md text-sm" />
                            </div>

                            <div className="flex justify-between gap-2">
                                <button type="submit" disabled={loading} className="bg-[#634a3e] text-white px-3 py-1.5 text-[11px] rounded-md hover:bg-[#4c3b31] transition-transform hover:-translate-y-0.5 flex-1 max-w-[120px]">
                                    {loading ? "Changing..." : "Confirm"}
                                </button>
                                <button type="button" className="bg-[#baa392] text-white px-3 py-1.5 text-[11px] rounded-md hover:bg-[#a89080] flex-1 max-w-[120px]" onClick={handleCancelChangePassword}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </>
            ) : isEditing ? (
                <>
                    <button
                        onClick={onBackClick}
                        className="absolute top-0 left-0 px-4 py-2 text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
                    >
                        <span>⬅</span> Back
                    </button>
                    <div>
                        <h2 className="mt-3 text-[18px] font-bold text-[#634a3e] text-center mb-[15px] pb-2 relative after:content-[''] after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-10 after:h-[2px] after:bg-[#baa392] after:rounded">
                            Edit Profile
                        </h2>
                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <label className="block font-semibold text-sm mb-1">Upload Profile Image:</label>
                                <input type="file" accept="image/*" onChange={handleFileChange} className="w-full p-2 border border-dashed border-[#baa392] rounded-md text-sm" />
                                {selectedFileName && (
                                    <p className="text-xs text-[#634a3e] mt-1 break-all">
                                        Selected: {selectedFileName}
                                    </p>
                                )}
                                {previewUrl && (
                                    <img src={previewUrl} alt="Preview" className="w-[80px] h-[80px] object-cover rounded-full mx-auto mt-2 shadow-md" />
                                )}
                            </div>

                            <div className="mb-3">
                                <label className="block font-semibold text-sm mb-1">Full Name:</label>
                                <input type="text" value={editFullname} onChange={handleFullnameChange} required className="w-full p-2 border border-[#baa392] rounded-md text-sm" />
                                {fullnameError && <p className="text-red-600 text-xs mt-1">{fullnameError}</p>}
                            </div>

                            <div className="mb-3">
                                <label className="block font-semibold text-sm mb-1">Phone Number:</label>
                                <input type="text" value={editPhoneNumber} onChange={handlePhoneNumberChange} required className="w-full p-2 border border-[#baa392] rounded-md text-sm" />
                                {phoneError && <p className="text-red-600 text-xs mt-1">{phoneError}</p>}
                            </div>

                            <div className="flex justify-between gap-2 mt-4">
                                <button type="submit" className="bg-[#634a3e] text-white px-3 py-1.5 text-[11px] rounded-md hover:bg-[#4c3b31] transition-transform hover:-translate-y-0.5 flex-1 max-w-[120px]">Save Changes</button>
                                <button type="button" onClick={handleCancelEdit} className="bg-[#baa392] text-white px-3 py-1.5 text-[11px] rounded-md hover:bg-[#a89080] flex-1 max-w-[120px]">Cancel</button>
                            </div>
                        </form>
                    </div>
                </>
            ) : isViewingRank ? (
                <>
                    <button
                        onClick={handleCancelViewRank}
                        className="absolute top-0 left-0 px-4 py-2 text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
                    >
                        <span>⬅</span> Back
                    </button>
                    <div>
                        <h2 className="mt-3 text-[18px] font-bold text-[#634a3e] text-center mb-[15px] pb-2 relative after:content-[''] after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-10 after:h-[2px] after:bg-[#baa392] after:rounded">
                            Your Ranks
                        </h2>
                        <ViewRanks />
                    </div>
                </>
            ) : (
                <>
                    <button
                        onClick={onBackClick}
                        className="absolute top-0 left-0 px-4 py-2 text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
                    >
                        <span>⬅</span> Back
                    </button>
                    <div>
                        <h2 className="mt-3 text-[18px] font-bold text-[#634a3e] text-center mb-[15px] pb-2 relative after:content-[''] after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-10 after:h-[2px] after:bg-[#baa392] after:rounded">
                            User Profile
                        </h2>
                        <div className="flex flex-col items-center text-center mb-4">
                            {profile.profileImage && (
                                <img
                                    src={profile.profileImage}
                                    alt="Profile"
                                    className="w-[80px] h-[80px] object-cover rounded-full mb-[10px] border-2 border-white shadow-md hover:scale-105 transition-transform duration-300"
                                />
                            )}
                            <div className="text-left w-full text-[#634a3e] text-sm">
                                <p className="mb-2 pb-2 border-b border-[#baa3924d] flex justify-between">
                                    <strong className="text-[#947260] font-semibold">Full Name:</strong> {profile.fullname}
                                </p>
                                <p className="mb-2 pb-2 border-b border-[#baa3924d] flex justify-between gap-x-1">
                                    <strong className="text-[#947260] font-semibold">Email:</strong>
                                    <span className="max-w-[150px] truncate" title={profile.email}>{profile.email}</span>
                                </p>
                                <p className="mb-2 pb-2 border-b border-[#baa3924d] flex justify-between">
                                    <strong className="text-[#947260] font-semibold">Rank:</strong>
                                    <span
                                        onClick={handleViewRankClick}
                                        className="text-[#8d6b4e] underline cursor-pointer"
                                    >
                                        {profile.rank || "No rank available"}
                                    </span>
                                </p>
                                <p className="mb-2 pb-2 border-b border-[#baa3924d] flex justify-between">
                                    <strong className="text-[#947260] font-semibold">Phone:</strong> {profile.phoneNumber}
                                </p>
                                <p className="flex justify-between">
                                    <strong className="text-[#947260] font-semibold">Created At:</strong>{" "}
                                    {new Date(profile.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-between gap-2 mt-4">
                            <button
                                onClick={handleEditToggle}
                                className="bg-[#634a3e] text-white px-3 py-1.5 text-[11px] font-semibold rounded-md shadow-sm hover:bg-[#4c3b31] transition-transform hover:-translate-y-0.5 flex-1 max-w-[120px]"
                            >
                                Edit Profile
                            </button>
                            <button
                                onClick={handleChangePasswordClick}
                                className="bg-[#baa392] text-white px-3 py-1.5 text-[11px] font-semibold rounded-md shadow-sm hover:bg-[#a89080] transition-transform hover:-translate-y-0.5 flex-1 max-w-[120px]"
                            >
                                Change Password
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default EditProfile;