import { Link } from 'react-router'

interface LinkItem {
  id: number;
  name: string;
  path: string;
}

function LinkRoute({ links }: { links: LinkItem[] }) {
  return (
    <div className="w-full h-[35px] xl:h-[45px] px-5 xl:px-16 bg-[#ECE6DF]">
      <div className="flex gap-5 leading-[35px] xl:leading-[50px]">
        <Link to='/' className="no-underline text-[16px] xl:text-[18px] text-gray-500 capitalize">home</Link>
        {links.map((link, index) => (
          <div className="flex gap-5 leading-[35px] xl:leading-[50px]" key={link.id}>
            <p className="text-[16px] xl:text-[18px] leading-[35px] xl:leading-[50px]">&gt;</p>
            <Link
              to={link.path}
              className="no-underline text-[16px] xl:text-[18px] capitalize"
              style={index === links.length - 1 ? { color: '#FF6600' } : { color: 'grey' }}
            >
              {link.name}
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}

export default LinkRoute

