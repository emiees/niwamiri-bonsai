import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Download, Upload, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import Header from '@/components/layout/Header'
import { exportBackup, importBackup } from '@/utils/backup'
import { useAppStore } from '@/store/appStore'
import { storageService } from '@/services/storage/DexieStorageService'

type Status = 'idle' | 'loading' | 'ok' | 'error'

export default function Backup() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language.startsWith('en') ? 'en' : 'es'

  const updateConfig = useAppStore((s) => s.updateConfig)
  const [exportStatus, setExportStatus] = useState<Status>('idle')
  const [importStatus, setImportStatus] = useState<Status>('idle')
  const [importMode, setImportMode] = useState<'replace' | 'merge'>('merge')
  const [showConfirm, setShowConfirm] = useState(false)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleExport() {
    setExportStatus('loading')
    try {
      const blob = await exportBackup()
      const date = new Date().toISOString().slice(0, 10)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `niwamiri_backup_${date}.zip`
      a.click()
      URL.revokeObjectURL(url)
      const now = Date.now()
      updateConfig({ lastBackupAt: now })
      await storageService.updateConfig({ lastBackupAt: now })
      setExportStatus('ok')
      setTimeout(() => setExportStatus('idle'), 3000)
    } catch {
      setExportStatus('error')
      setTimeout(() => setExportStatus('idle'), 3000)
    }
  }

  function onFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPendingFile(file)
    if (importMode === 'replace') {
      setShowConfirm(true)
    } else {
      runImport(file)
    }
    e.target.value = ''
  }

  async function runImport(file: File) {
    setShowConfirm(false)
    setImportStatus('loading')
    try {
      await importBackup(file, importMode)
      setImportStatus('ok')
      setTimeout(() => { setImportStatus('idle'); window.location.reload() }, 1500)
    } catch {
      setImportStatus('error')
      setTimeout(() => setImportStatus('idle'), 3000)
    }
    setPendingFile(null)
  }

  const statusIcon = (s: Status) => {
    if (s === 'loading') return <Loader2 size={16} className="animate-spin" />
    if (s === 'ok') return <CheckCircle2 size={16} />
    if (s === 'error') return <AlertCircle size={16} />
    return null
  }

  return (
    <AppShell showNav={false}>
      <Header title={t('backup.title')} showBack />

      <div className="flex flex-col gap-4 px-4 py-4">
        {/* Export */}
        <div
          className="overflow-hidden rounded-2xl"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        >
          <div className="px-4 py-4">
            <h3 className="font-semibold text-sm mb-1" style={{ color: 'var(--text1)' }}>
              {t('backup.export')}
            </h3>
            <p className="text-xs mb-4" style={{ color: 'var(--text3)' }}>
              {lang === 'es'
                ? 'Descarga un archivo .zip con todos tus árboles, cuidados, fotos y notas.'
                : 'Downloads a .zip file with all your trees, cares, photos, and notes.'}
            </p>
            <button
              onClick={handleExport}
              disabled={exportStatus === 'loading'}
              className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold disabled:opacity-50"
              style={{
                background: exportStatus === 'ok' ? '#22c55e' : exportStatus === 'error' ? '#ef4444' : 'var(--color-accent)',
                color: exportStatus === 'ok' ? 'white' : exportStatus === 'error' ? 'white' : 'var(--green1)',
              }}
            >
              {exportStatus !== 'idle'
                ? statusIcon(exportStatus)
                : <Download size={16} />}
              {exportStatus === 'ok'
                ? t('backup.exportSuccess')
                : exportStatus === 'error'
                ? t('common.error')
                : t('backup.export')}
            </button>
          </div>
        </div>

        {/* Import */}
        <div
          className="overflow-hidden rounded-2xl"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        >
          <div className="px-4 py-4">
            <h3 className="font-semibold text-sm mb-1" style={{ color: 'var(--text1)' }}>
              {t('backup.import')}
            </h3>
            <p className="text-xs mb-3" style={{ color: 'var(--text3)' }}>
              {lang === 'es'
                ? 'Restaura desde un archivo .zip de backup anterior.'
                : 'Restore from a previous .zip backup file.'}
            </p>

            {/* Mode selector */}
            <div className="mb-4 flex rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
              {(['merge', 'replace'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setImportMode(mode)}
                  className="flex-1 py-2.5 text-xs font-medium"
                  style={{
                    background: importMode === mode ? 'var(--color-accent)' : 'var(--bg3)',
                    color: importMode === mode ? 'var(--green1)' : 'var(--text2)',
                  }}
                >
                  {mode === 'merge' ? t('backup.merge') : t('backup.replace')}
                </button>
              ))}
            </div>

            {importMode === 'replace' && (
              <div
                className="mb-3 rounded-xl px-3 py-2"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}
              >
                <p className="text-xs" style={{ color: '#ef4444' }}>
                  {lang === 'es'
                    ? '⚠️ El modo Reemplazar borrará todos los datos actuales.'
                    : '⚠️ Replace mode will delete all current data.'}
                </p>
              </div>
            )}

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={importStatus === 'loading'}
              className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold disabled:opacity-50"
              style={{
                background: importStatus === 'ok' ? '#22c55e' : importStatus === 'error' ? '#ef4444' : 'var(--bg3)',
                color: importStatus === 'ok' ? 'white' : importStatus === 'error' ? 'white' : 'var(--text2)',
                border: `1px solid ${importStatus === 'idle' ? 'var(--border)' : 'transparent'}`,
              }}
            >
              {importStatus !== 'idle'
                ? statusIcon(importStatus)
                : <Upload size={16} />}
              {importStatus === 'ok'
                ? t('backup.importSuccess')
                : importStatus === 'error'
                ? t('common.error')
                : t('backup.import')}
            </button>
          </div>
        </div>

        <p className="text-center text-xs" style={{ color: 'var(--text3)' }}>
          {lang === 'es'
            ? 'Los datos se almacenan solo en tu dispositivo. El backup es tu único respaldo.'
            : 'Data is stored only on your device. The backup is your only safeguard.'}
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".zip"
        className="hidden"
        onChange={onFileSelected}
      />

      {/* Replace confirm dialog */}
      {showConfirm && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setShowConfirm(false)} />
          <div
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl px-5 py-6"
            style={{ background: 'var(--bg)' }}
          >
            <p className="mb-2 text-base font-semibold" style={{ color: 'var(--text1)' }}>
              {t('backup.importWarning').split('?')[0]}
            </p>
            <p className="mb-5 text-sm" style={{ color: 'var(--text3)' }}>
              {lang === 'es'
                ? 'Se eliminarán todos los datos actuales y se reemplazarán con el backup.'
                : 'All current data will be deleted and replaced with the backup.'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowConfirm(false); setPendingFile(null) }}
                className="flex-1 rounded-2xl py-3 text-sm"
                style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text2)' }}
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={() => pendingFile && runImport(pendingFile)}
                className="flex-1 rounded-2xl py-3 text-sm font-semibold"
                style={{ background: '#ef4444', color: 'white' }}
              >
                {t('common.confirm')}
              </button>
            </div>
          </div>
        </>
      )}
    </AppShell>
  )
}
