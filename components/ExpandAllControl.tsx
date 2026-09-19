'use client'
import styles from './ExpandAllControl.module.css'

interface Props {
  allOpen: boolean
  onExpandAll: () => void
  onCollapseAll: () => void
}

export default function ExpandAllControl({ allOpen, onExpandAll, onCollapseAll }: Props) {
  return (
    <div className={styles.wrap}>
      <button
        type="button"
        className={`${styles.control} raised-sm`}
        onClick={allOpen ? onCollapseAll : onExpandAll}
      >
        {allOpen ? 'Collapse all' : 'Expand all'}
      </button>
    </div>
  )
}
