"use client"

import { useAuth, useForms, useGetOrCreateGeneralForm } from "@/hooks"
import { useRouter } from "next/navigation"
import { useMemo, useEffect, useState } from "react"
import { MessageSquare, Plus, Share2, LogOut, QrCode } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/logo"
import Link from "next/link"
import { useIsMobile } from "@/hooks/use-mobile"
import { Badge } from "@/components/ui/badge"
import { CreateFormModal } from "@/components/create-form-modal"
import { FormShareModal } from "@/components/form-share-modal"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { cn } from "@/lib/utils"

export default function DashboardPage() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const isMobile = useIsMobile()
  const isOrganization = user?.userType === "organization"
  const teacherId = isOrganization ? null : (user?.id || null)
  const organizationId = isOrganization ? user?.id : undefined
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [selectedForm, setSelectedForm] = useState<{ id: string; name: string } | null>(null)

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

  const handleShareClick = (e: React.MouseEvent, form: { id: string; name: string }) => {
    e.stopPropagation() // Prevent form click
    setSelectedForm(form)
    setShareModalOpen(true)
  }

  return (
    <div className="min-h-screen bg-[#f0f2f5] dark:bg-[#111b21] flex w-full overflow-x-hidden">
      {/* Desktop Sidebar */}
      <DashboardSidebar />

      {/* Main Content */}
      <main className={cn(
        "flex-1 flex flex-col transition-all duration-200 w-full",
        !isMobile && "ml-64"
      )}>
        {/* Header */}
        <header className="sticky top-0 z-50 bg-primary dark:bg-primary border-b border-border">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Logo width={32} height={32} className="text-primary-foreground" />
              <h1 className="text-lg font-semibold text-primary-foreground">
                {user?.name || "Dashboard"}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/qr-code">
                <Button size="sm" variant="ghost" className="h-9 w-9 p-0 text-primary-foreground hover:bg-primary-foreground/10">
                  <QrCode className="h-4 w-4" />
                </Button>
              </Link>
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-9 w-9 p-0 text-primary-foreground hover:bg-primary-foreground/10"
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

        {/* Forms List */}
        <div className="flex-1 overflow-y-auto bg-background">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">Loading forms...</div>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {/* General Form - Always at top */}
            {generalForm && (
              <div
                onClick={() => handleFormClick(generalForm.id)}
                className="p-4 cursor-pointer bg-card hover:bg-accent transition-colors rounded-lg border border-border shadow-sm hover:shadow-md"
              >
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-xl bg-primary flex items-center justify-center shrink-0">
                    <MessageSquare className="h-7 w-7 text-primary-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-card-foreground truncate">
                        {generalForm.name}
                      </h3>
                      <Badge variant="default" className="bg-primary text-primary-foreground text-xs">
                        General
                      </Badge>
                    </div>
                    {generalForm.description && (
                      <p className="text-sm text-muted-foreground truncate">
                        {generalForm.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-9 w-9 text-muted-foreground hover:bg-accent"
                      onClick={(e) => handleShareClick(e, { id: generalForm.id, name: generalForm.name })}
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                    <div className="text-xs text-muted-foreground">
                      →
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Custom Forms */}
            {customForms.length > 0 && (
              <>
                {customForms.length > 0 && generalForm && (
                  <div className="px-2 py-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Custom Forms
                    </p>
                  </div>
                )}
                {customForms.map((form) => (
                  <div
                    key={form.id}
                    onClick={() => handleFormClick(form.id)}
                    className="p-4 cursor-pointer bg-card hover:bg-accent transition-colors rounded-lg border border-border shadow-sm hover:shadow-md"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 rounded-xl bg-muted flex items-center justify-center shrink-0">
                        <MessageSquare className="h-7 w-7 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-card-foreground truncate mb-1">
                          {form.name}
                        </h3>
                        {form.description && (
                          <p className="text-sm text-muted-foreground truncate mb-2">
                            {form.description}
                          </p>
                        )}
                        {form.tags && form.tags.length > 0 && (
                          <div className="flex gap-1.5 mt-2 flex-wrap">
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
                              <span className="text-xs text-muted-foreground">
                                +{form.tags.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-9 w-9 text-muted-foreground hover:bg-accent"
                          onClick={(e) => handleShareClick(e, { id: form.id, name: form.name })}
                        >
                          <Share2 className="h-4 w-4" />
                        </Button>
                        <div className="text-xs text-muted-foreground">
                          →
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* Empty State */}
            {!generalForm && customForms.length === 0 && (
              <div className="px-4 py-12 text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No forms yet. Create your first form to get started.
                </p>
              </div>
            )}
          </div>
        )}
        </div>

        {/* Floating Create Form Button */}
        <div className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50">
          <Button
            onClick={() => setCreateModalOpen(true)}
            size="lg"
            className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow bg-primary hover:bg-primary/90"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />

      {/* Create Form Modal */}
      <CreateFormModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        teacherId={teacherId || undefined}
        organizationId={organizationId}
      />

      {/* Share Form Modal */}
      {selectedForm && (
        <FormShareModal
          open={shareModalOpen}
          onOpenChange={setShareModalOpen}
          formId={selectedForm.id}
          formName={selectedForm.name}
          teacherId={teacherId || undefined}
          organizationId={organizationId}
        />
      )}
    </div>
  )
}
