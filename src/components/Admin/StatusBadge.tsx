import styles from '../../css/AdminCss/StatusBadge.module.css';

interface StatusBadgeProps {
  status: boolean;
  caseTrue: string;
  caseFalse: string;
}

const StatusBadge = ({ status, caseTrue, caseFalse }: StatusBadgeProps) => {
  var statusTitle = '';

  if (status){
    statusTitle = caseTrue;
  } else {
    statusTitle = caseFalse
  }

  return (
    <span className={`${styles.badge} ${status === true ? styles.available : styles.unavailable}`}>
      <span className={styles.dot}></span>
      {statusTitle}
    </span>
  );
};

export default StatusBadge;
