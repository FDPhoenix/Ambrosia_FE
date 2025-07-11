import avt from '../../assets/avatar.png'
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';

function AdminHeader(props: { title: string }) {
    const token = Cookies.get("token") ?? null;
    var decodeToken: any;
    
    if (token) {
        decodeToken = jwtDecode(token);
    }

    return (
        <div className="h-[70px] w-[1200px] px-5 flex justify-between bg-white rounded-[15px] mb-[25px] shadow-md">
            <h1 className="text-[26px] leading-[68px] bg-white">{props.title}</h1>

            <div className="flex gap-[25px]">
                <div className="my-auto p-[7px_9px] bg-[#F09C42] rounded-[5px]">
                    <svg xmlns="http://www.w3.org/2000/svg"
                        className="w-[22px] h-[22px] stroke-current"
                        viewBox="0 0 24 24"
                        strokeWidth="1.5"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round">
                        <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                        <path d="M10 5a2 2 0 0 1 4 0a7 7 0 0 1 4 6v3a4 4 0 0 0 2 3h-16a4 4 0 0 0 2 -3v-3a7 7 0 0 1 4 -6"></path>
                        <path d="M9 17v1a3 3 0 0 0 6 0v-1"></path>
                        <path d="M21 6.727a11.05 11.05 0 0 0 -2.794 -3.727"></path>
                        <path d="M3 6.727a11.05 11.05 0 0 1 2.792 -3.727"></path>
                    </svg>
                </div>

                <div className="my-auto">
                    <img src={decodeToken.image || avt} alt="User avatar" className="w-[35px] h-[35px] rounded-full" />
                </div>
            </div>
        </div>
    )
}

export default AdminHeader