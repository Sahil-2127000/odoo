import { Hammer } from 'lucide-react'
import { Card, EmptyState, PageHeader } from '@/components/ui'

/** Temporary placeholder for pages not built yet. */
export default function ComingSoon({ title = 'Coming soon', subtitle }) {
  return (
    <>
      <PageHeader title={title} subtitle={subtitle} />
      <Card>
        <EmptyState icon={Hammer} title="Under construction" description="This page is being built." />
      </Card>
    </>
  )
}
