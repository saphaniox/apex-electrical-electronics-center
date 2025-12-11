import React from 'react'
import { Empty, Button } from 'antd'

/**
 * Reusable empty state component for tables with no data
 */
function EmptyState({ title = 'No Data', description = 'No records found', onAction = null, actionLabel = 'Create New' }) {
  return (
    <Empty
      description={description}
      style={{ marginTop: '48px' }}
      image={Empty.PRESENTED_IMAGE_SIMPLE}
    >
      {onAction && (
        <Button type="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </Empty>
  )
}

export default EmptyState
