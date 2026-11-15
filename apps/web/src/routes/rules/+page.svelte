<script lang="ts">
  import { useClientConfig } from '$lib/query/config'
  import Card from '$lib/ui/card.svelte'

  const configQuery = useClientConfig()
  const ctfName = $derived(configQuery.data?.ctfName ?? 'CompIT 2026')

  // Template section rules - siap diisi saat panitia mengirimkan teks final
  const ruleSections = [
    {
      title: '1. Ketentuan Umum & Peserta',
      description: 'Syarat kepesertaan, komposisi anggota tim, dan integritas perlombaan.',
      placeholder: 'Detail peraturan mengenai ketentuan umum peserta akan diperbarui di sini setelah dirilis resmi oleh panitia.',
    },
    {
      title: '2. Format Kompetisi & Flag',
      description: 'Format jeopardy, kategori tantangan, dan standar format flag submission.',
      placeholder: 'Detail format kompetisi, daftar kategori, dan format flag resmi akan diperbarui di sini.',
    },
    {
      title: '3. Sistem Penilaian (Dynamic Scoring)',
      description: 'Mekanisme perhitungan poin dinamis, decay, dan sistem tiebreaker.',
      placeholder: 'Detail sistem penilaian dan ketentuan scoreboard akan diperbarui di sini.',
    },
    {
      title: '4. Tata Tertib & Larangan Keras',
      description: 'Ketentuan fair play, larangan DoS/DDoS, larangan berbagi flag, dan sanksi diskualifikasi.',
      placeholder: 'Daftar larangan dan sanksi pelanggaran akan diperbarui di sini.',
    },
    {
      title: '5. Ketentuan Write-Up',
      description: 'Kewajiban laporan penyelesaian soal bagi tim pemuncak scoreboard.',
      placeholder: 'Format dokumen, batas waktu pengumpulan, dan kriteria write-up akan diperbarui di sini.',
    },
  ]
</script>

<svelte:head>
  <title>Rules | {ctfName}</title>
</svelte:head>

<div class="rules-container">
  <div class="rules-header">
    <h1>Rules & Regulations</h1>
    <p class="subtitle">Peraturan & Ketentuan Resmi Perlombaan {ctfName}</p>
  </div>

  <!-- Announcement Notice Card -->
  <div class="notice-card">
    <div class="notice-icon">📢</div>
    <div class="notice-body">
      <h3>Informasi Peraturan Kompetisi</h3>
      <p>
        Buku panduan dan peraturan lengkap <strong>{ctfName}</strong> saat ini sedang difinalisasi oleh panitia.
        Rincian peraturan resmi akan segera dipublikasikan di halaman ini sebelum kompetisi dimulai.
      </p>
    </div>
  </div>

  <!-- Template Sections -->
  <div class="rules-grid">
    {#each ruleSections as section}
      <Card title={section.title} description={section.description}>
        <div class="template-box">
          <p class="placeholder-text">
            <em>{section.placeholder}</em>
          </p>
        </div>
      </Card>
    {/each}
  </div>
</div>

<style>
  .rules-container {
    max-width: 56rem;
    margin: 0 auto;
    padding: var(--space-s) var(--space-m) var(--space-2xl);
    display: flex;
    flex-direction: column;
    gap: var(--space-l);
  }

  .rules-header {
    text-align: center;
    display: flex;
    flex-direction: column;
    gap: var(--space-3xs);
    margin-bottom: var(--space-xs);
  }

  .rules-header h1 {
    font-size: var(--step-3, 2rem);
    font-weight: 800;
    letter-spacing: -0.02em;
    background: linear-gradient(135deg, #e2e8f0 0%, #38bdf8 100%);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin: 0;
  }

  .subtitle {
    color: var(--foreground-l2, #94a3b8);
    font-size: var(--step-0, 1rem);
    margin: 0;
  }

  .notice-card {
    display: flex;
    gap: var(--space-s);
    align-items: flex-start;
    padding: var(--space-s) var(--space-m);
    background: rgba(14, 165, 233, 0.08);
    border: 1px solid rgba(56, 189, 248, 0.25);
    border-radius: var(--radius-lg);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
  }

  .notice-icon {
    font-size: 1.5rem;
    line-height: 1;
    flex-shrink: 0;
    margin-top: 0.15rem;
  }

  .notice-body h3 {
    margin: 0 0 0.25rem 0;
    font-size: 1rem;
    font-weight: 600;
    color: #38bdf8;
  }

  .notice-body p {
    margin: 0;
    font-size: 0.9rem;
    color: var(--foreground-l1, #cbd5e1);
    line-height: 1.5;
  }

  .rules-grid {
    display: flex;
    flex-direction: column;
    gap: var(--space-m);
  }

  .template-box {
    padding: var(--space-s);
    background: rgba(15, 23, 42, 0.5);
    border: 1px dashed rgba(148, 163, 184, 0.2);
    border-radius: var(--radius-md);
  }

  .placeholder-text {
    margin: 0;
    color: var(--foreground-l3, #94a3b8);
    font-size: 0.9rem;
    line-height: 1.5;
  }
</style>
