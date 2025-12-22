"use client"

import { useAuth, useForms, useGetOrCreateGeneralForm } from "@/hooks"
import { useRouter } from "next/navigation"
import { useMemo, useEffect, useState } from "react"
import { MessageSquare, Plus, Settings, LogOut, QrCode } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/logo"
import Link from "next/link"
import { useIsMobile } from "@/hooks/use-mobile"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CreateFormModal } from "@/components/create-form-modal"

export default function DashboardPage() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const isMobile = useIsMobile()
  const isOrganization = user?.userType === "organization"
  const teacherId = isOrganization ? null : (user?.id || null)
  const organizationId = isOrganization ? user?.id : undefined
  const [createModalOpen, setCreateModalOpen] = useState(false)

  const { data: formsData, isLoading } = useForms({
    teacherId: teacherId || undefined,
    organizationId: organizationId,
  })

  const createGeneralForm = useGetOrCreateGeneralForm()

  // Ensure general form exists (only check once when forms are loaded)
  useEffect(() => {
    if (user && formsData?.forms && !isLoading) {
      const hasGeneralForm = formsData.forms.some(f => f.isGeneral)
      if (!hasGeneralForm && !createGeneralForm.isPending) {
        createGeneralForm.mutate({
          teacherId: teacherId || undefined,
          organizationId: organizationId,
        })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, formsData?.forms, isLoading])

  const forms = formsData?.forms || []

  // Separate general form and custom forms
  const { generalForm, customForms } = useMemo(() => {
    const general = forms.find(f => f.isGeneral)
    const custom = forms.filter(f => !f.isGeneral && f.isActive)
    return { generalForm: general, customForms: custom }
  }, [forms])

  const handleFormClick = (formId: string) => {
    router.push(`/dashboard/forms/${formId}`)
  }

  return (
    <div className="min-h-screen bg-[#f0f2f5] dark:bg-[#111b21]">
      {/* Header - WhatsApp style */}
      <header className="sticky top-0 z-50 bg-[#008069] dark:bg-[#202c33] border-b border-[#008069]/20">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Logo width={32} height={32} className="text-white" />
              <h1 className="text-lg font-semibold text-white">
                {user?.name || "Dashboard"}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/dashboard/settings">
                <Button size="sm" variant="ghost" className="h-9 w-9 p-0 text-white hover:bg-white/10">
                  <Settings className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/qr-code">
                <Button size="sm" variant="ghost" className="h-9 w-9 p-0 text-white hover:bg-white/10">
                  <QrCode className="h-4 w-4" />
                </Button>
              </Link>
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-9 w-9 p-0 text-white hover:bg-white/10"
                onClick={() => {
                  logout()
                  router.push("/login")
                }}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Forms List - WhatsApp contacts style */}
      <main className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">Loading forms...</div>
          </div>
        ) : (
          <div className="bg-white dark:bg-[#202c33]">
            {/* General Form - Always at top with different background */}
            {generalForm && (
              <div
                onClick={() => handleFormClick(generalForm.id)}
                className="px-4 py-3 cursor-pointer hover:bg-[#f5f6f6] dark:hover:bg-[#2a3942] transition-colors border-b border-[#e9edef] dark:border-[#313d45] bg-gradient-to-r from-[#008069]/5 to-[#008069]/10 dark:from-[#008069]/10 dark:to-[#008069]/20"
              >
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-[#008069] dark:bg-[#008069] flex items-center justify-center shrink-0">
                    <MessageSquare className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-[#111b21] dark:text-[#e9edef] truncate">
                        {generalForm.name}
                      </h3>
                      <Badge variant="default" className="bg-[#008069] text-white text-xs">
                        General
                      </Badge>
                    </div>
                    {generalForm.description && (
                      <p className="text-sm text-[#667781] dark:text-[#8696a0] truncate mt-0.5">
                        {generalForm.description}
                      </p>
                    )}
                  </div>
                  <div className="text-xs text-[#667781] dark:text-[#8696a0] shrink-0">
                    →
                  </div>
                </div>
              </div>
            )}

            {/* Custom Forms */}
            {customForms.length > 0 && (
              <>
                {customForms.length > 0 && generalForm && (
                  <div className="px-4 py-2 bg-[#f0f2f5] dark:bg-[#111b21] border-b border-[#e9edef] dark:border-[#313d45]">
                    <p className="text-xs font-medium text-[#667781] dark:text-[#8696a0] uppercase">
                      Custom Forms
                    </p>
                  </div>
                )}
                {customForms.map((form) => (
                  <div
                    key={form.id}
                    onClick={() => handleFormClick(form.id)}
                    className="px-4 py-3 cursor-pointer hover:bg-[#f5f6f6] dark:hover:bg-[#2a3942] transition-colors border-b border-[#e9edef] dark:border-[#313d45]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-[#54656f] dark:bg-[#54656f] flex items-center justify-center shrink-0">
                        <MessageSquare className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-[#111b21] dark:text-[#e9edef] truncate">
                          {form.name}
                        </h3>
                        {form.description && (
                          <p className="text-sm text-[#667781] dark:text-[#8696a0] truncate mt-0.5">
                            {form.description}
                          </p>
                        )}
                        {form.tags && form.tags.length > 0 && (
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {form.tags.slice(0, 3).map((formTag) => (
                              <Badge
                                key={formTag.id}
                                variant="outline"
                                className="text-xs"
                                style={{
                                  borderColor: formTag.tag.color || undefined,
                                  color: formTag.tag.color || undefined,
                                }}
                              >
                                {formTag.tag.name}
                              </Badge>
                            ))}
                            {form.tags.length > 3 && (
                              <span className="text-xs text-[#667781] dark:text-[#8696a0]">
                                +{form.tags.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-[#667781] dark:text-[#8696a0] shrink-0">
                        →
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* Empty State */}
            {!generalForm && customForms.length === 0 && (
              <div className="px-4 py-12 text-center">
                <MessageSquare className="h-12 w-12 text-[#667781] dark:text-[#8696a0] mx-auto mb-4" />
                <p className="text-[#667781] dark:text-[#8696a0]">
                  No forms yet. Create your first form to get started.
                </p>
              </div>
            )}

            {/* Create Form Button */}
            <div
              onClick={() => setCreateModalOpen(true)}
              className="px-4 py-3 cursor-pointer hover:bg-[#f5f6f6] dark:hover:bg-[#2a3942] transition-colors border-t border-[#e9edef] dark:border-[#313d45]"
            >
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-[#008069] dark:bg-[#008069] flex items-center justify-center shrink-0">
                  <Plus className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-[#111b21] dark:text-[#e9edef]">
                    Create New Form
                  </h3>
                  <p className="text-sm text-[#667781] dark:text-[#8696a0]">
                    Add a custom feedback form
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Create Form Modal */}
      <CreateFormModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        teacherId={teacherId || undefined}
        organizationId={organizationId}
      />
    </div>
  )
}
