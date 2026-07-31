import { useColleges } from '@/context/CollegeContext'
import type { College } from '@/lib/colleges'
import PremiumSchoolCard from '@/components/sage/PremiumSchoolCard'

export default function SchoolCard({ collegeId }: { collegeId: string }) {
  const { colleges } = useColleges()
  const college = colleges.find(c => c.id === collegeId) as College | undefined

  if (!college) return null

  return <PremiumSchoolCard college={college} compact />
}
