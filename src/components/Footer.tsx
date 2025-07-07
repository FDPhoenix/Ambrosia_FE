import { Link } from 'react-router'

function Footer() {
    return (
        <div className="w-full bg-[#ECE6DF] border-t border-[#8B7355] px-4 flex flex-col md:flex-row md:items-center md:justify-between md:px-16 md:py-[10px]">
            <p className="text-[14px] py-[4px] text-center md:text-left md:py-0 md:text-[16px]">
                © 2025 Ambrosia. All rights reserved
            </p>
            <div className="hidden md:flex gap-4 leading-10">
                <Link
                    to="/privacy"
                    className="text-[var(--secondary-color)] transition-colors duration-200 no-underline hover:underline"
                >
                    Privacy Policy
                </Link>
                <Link
                    to="/terms"
                    className="text-[var(--secondary-color)] transition-colors duration-200 no-underline hover:underline"
                >
                    Terms of Service
                </Link>
                <Link
                    to="/cookies"
                    className="text-[var(--secondary-color)] transition-colors duration-200 no-underline hover:underline"
                >
                    Cookie Settings
                </Link>
            </div>
        </div>
    )
}

export default Footer
