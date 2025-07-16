import styles from '../css/PageName.module.css'

interface PageNameProps {
    name: string;
    fixed?: boolean;
}

function PageName(props: PageNameProps) {
    return (
        <div className={`${styles.container} hidden md:block w-full h-[370px] bg-cover ${props.fixed ? 'mt-[72px]' : ''}`}>
            <h1 className='ml-40 leading-[360px] text-8xl text-[#f2f2f2]'>{props.name}</h1>
        </div>
    )
}

export default PageName
