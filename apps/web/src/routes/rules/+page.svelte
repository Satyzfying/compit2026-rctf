<script lang="ts">
  import { useClientConfig } from '$lib/query/config'
  import Card from '$lib/ui/card.svelte'

  const configQuery = useClientConfig()
  const ctfName = $derived(configQuery.data?.ctfName ?? 'CompIT 2026')

  // Peraturan resmi kompetisi CompIT 2026
  const ruleSections = [
    {
      title: '1. Format Kompetisi & Kategori Soal',
      description: 'Model tantangan dan cakupan bidang keamanan siber yang diujikan.',
      content:
        'Model kompetisi yang digunakan adalah Jeopardy dengan kategori Cryptography, Web Exploitation, Binary Exploitation, Digital Forensic, Reverse Engineering, dan Miscellaneous.',
    },
    {
      title: '2. Waktu Pelaksanaan Kompetisi',
      description: 'Jadwal pembukaan dan penutupan platform perlombaan.',
      content:
        'Kompetisi berlangsung selama 2 hari, dimulai pada tanggal 16 November 2026 pukul 09:00 WIB dan berakhir pada tanggal 17 November 2026 pukul 23:59 WIB.',
    },
    {
      title: '3. Sistem Penilaian (Dynamic Scoring) & Peringkat',
      description: 'Mekanisme skor dinamis dan penentuan posisi tim.',
      content:
        'Penilaian ditentukan dari seberapa tinggi peringkat dan total nilai yang didapatkan. Bobot nilai bersifat dinamis, dimana akan berkurang seiring dengan banyaknya peserta yang dapat menyelesaikan soal tersebut.',
    },
    {
      title: '4. Tata Tertib & Larangan Penggunaan AI',
      description: 'Integritas pengerjaan mandiri dan saluran komunikasi bantuan panitia.',
      content:
        'Selama pengerjaan, peserta tidak diperbolehkan menggunakan bantuan AI dalam bentuk apapun. Jika terdapat keraguan, diharapkan untuk open ticket dan bertanya kepada panitia.',
      highlight: true,
    },
    {
      title: '5. Kewajiban Write-Up (Top 10 Scoreboard)',
      description: 'Laporan teknis penyelesaian tantangan untuk verifikasi submisi.',
      content:
        'Write-up merupakan kewajiban mutlak bagi tim yang menempati peringkat 10 keatas pada scoreboard untuk menguji orisinalitas dan validitas submisi flag selama perlombaan berlangsung.',
    },
    {
      title: '6. Diskualifikasi & Penyesuaian Juara (Podium)',
      description: 'Konsekuensi kecurangan atau ketiadaan write-up bagi pemenang.',
      content:
        'Jika tim yang berhasil menempati posisi 1, 2, dan 3 pada scoreboard terdapat indikasi kecurangan atau tidak mengumpulkan write up sampai batas yang ditentukan maka tim yang berada di peringkat dibawahnya akan naik ke atas.',
    },
  ]
</script>

<svelte:head>
  <title>Rules | {ctfName}</title>
</svelte:head>

<div class="rules-container">
  <div class="rules-header">
    <h1>Rules & Regulations</h1>
    <p class="subtitle">Official Competition Rules & Regulations for {ctfName}</p>
  </div>

  <!-- Announcement Notice Card -->
  <div class="notice-card">
    <div class="notice-indicator" aria-hidden="true"></div>
    <div class="notice-body">
      <h3>Official Rules & Code of Conduct</h3>
      <p>
        All participants of <strong>{ctfName}</strong> must understand and strictly adhere to all regulations below.
        Violations may result in point forfeiture up to team disqualification.
      </p>
    </div>
  </div>

  <!-- Rule Sections -->
  <div class="rules-grid">
    {#each ruleSections as section}
      <Card title={section.title} description={section.description}>
        <div class="rule-body" class:highlight={section.highlight}>
          <p>{section.content}</p>
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
    font-size: 2rem;
    font-weight: 600;
    letter-spacing: -0.02em;
    color: #ededed;
    margin: 0;
  }

  .subtitle {
    color: #a3a9b8;
    font-size: 1rem;
    margin: 0;
  }

  .notice-card {
    display: flex;
    gap: 0.75rem;
    align-items: flex-start;
    padding: 0.85rem 1.15rem;
    background: rgba(10, 22, 42, 0.88);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(56, 189, 248, 0.2);
    border-radius: 8px;
  }

  .notice-indicator {
    width: 0.5rem;
    height: 0.5rem;
    border-radius: 50%;
    background: #38bdf8;
    flex-shrink: 0;
    margin-top: 0.45rem;
  }

  .notice-body h3 {
    margin: 0 0 0.25rem 0;
    font-size: 0.9375rem;
    font-weight: 500;
    color: #f1f5f9;
  }

  .notice-body p {
    margin: 0;
    font-size: 0.875rem;
    color: #94a3b8;
    line-height: 1.5;
  }

  .rules-grid {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .rule-body {
    padding: 0.85rem 1.15rem;
    background: rgba(6, 14, 28, 0.75);
    border: 1px solid rgba(56, 189, 248, 0.12);
    border-radius: 8px;
  }

  .rule-body.highlight {
    border-color: rgba(56, 189, 248, 0.28);
    background: rgba(8, 20, 38, 0.85);
  }

  .rule-body p {
    margin: 0;
    color: #cbd5e1;
    font-size: 0.925rem;
    line-height: 1.6;
  }
</style>
