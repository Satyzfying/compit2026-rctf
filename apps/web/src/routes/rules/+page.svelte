<script lang="ts">
  import { useClientConfig } from '$lib/query/config'
  import Card from '$lib/ui/card.svelte'

  const configQuery = useClientConfig()
  const ctfName = $derived(configQuery.data?.ctfName ?? 'CompIT 2026')
</script>

<svelte:head>
  <title>Rules | {ctfName}</title>
</svelte:head>

<div class="rules-container">
  <div class="rules-header">
    <h1>Rules & Regulations</h1>
    <p class="subtitle">Peraturan & Ketentuan Resmi Perlombaan {ctfName}</p>
  </div>

  <div class="rules-grid">
    <!-- 1. Ketentuan Umum -->
    <Card title="1. Ketentuan Umum Peserta">
      <ul class="rule-list">
        <li>Peserta merupakan mahasiswa aktif Departemen Teknologi Informasi Institut Teknologi Sepuluh Nopember (ITS).</li>
        <li>Kompetisi dimainkan dalam format <strong>Tim</strong> yang beranggotakan <strong>2 hingga 3 orang</strong>.</li>
        <li>Akun peserta disediakan secara resmi oleh panitia. Pendaftaran mandiri di web ditutup untuk menjaga integritas data peserta.</li>
        <li>Setiap peserta wajib menjunjung tinggi nilai sportivitas, kejujuran, dan etika akademik selama kompetisi berlangsung.</li>
      </ul>
    </Card>

    <!-- 2. Format Soal & Flag -->
    <Card title="2. Format Kompetisi & Flag">
      <ul class="rule-list">
        <li>Format kompetisi adalah <strong>Jeopardy CTF</strong> dengan kategori:
          <span class="badge-group">
            <span class="badge">Web Exploitation</span>
            <span class="badge">Binary Exploitation</span>
            <span class="badge">Cryptography</span>
            <span class="badge">Digital Forensics</span>
            <span class="badge">Reverse Engineering</span>
            <span class="badge">Miscellaneous</span>
          </span>
        </li>
        <li>Format flag resmi: <code>compit&#123;...&#125;</code> (bersifat <em>case-sensitive</em>, kecuali dinyatakan lain pada deskripsi soal).</li>
        <li>Setiap flag yang valid hanya dapat disubmit satu kali per tim.</li>
      </ul>
    </Card>

    <!-- 3. Sistem Penilaian -->
    <Card title="3. Dynamic Scoring & Scoreboard">
      <ul class="rule-list">
        <li>Sistem penilaian menggunakan <strong>Dynamic Scoring</strong>:
          <ul>
            <li>Skor awal (maksimum): <strong>500 poin</strong>.</li>
            <li>Skor minimum (floor): <strong>100 poin</strong>.</li>
            <li>Nilai soal akan menurun secara dinamis seiring bertambahnya jumlah tim yang berhasil menyelesaikan (<em>solve</em>) soal tersebut.</li>
          </ul>
        </li>
        <li>Peringkat ditentukan berdasarkan akumulasi poin tertinggi.</li>
        <li>Jika terdapat tim dengan poin yang sama, sistem <strong>Tiebreaker</strong> akan memprioritaskan tim yang mencapai skor tersebut lebih awal.</li>
      </ul>
    </Card>

    <!-- 4. Larangan Keras -->
    <Card title="4. Larangan & Pelanggaran (Disqualification)">
      <div class="warning-callout">
        <strong>PENTING:</strong> Pelanggaran terhadap poin-poin di bawah ini akan dikenakan sanksi diskualifikasi langsung tanpa peringatan:
      </div>
      <ul class="rule-list alert-list">
        <li><strong>Dilarang Melakukan DoS / DDoS:</strong> Dilarang menyerang, membanjiri request berlebihan, atau mengganggu stabilitas infrastruktur platform rCTF maupun server soal.</li>
        <li><strong>Dilarang Flag Sharing:</strong> Dilarang membagikan flag, solusi, atau hint kepada tim lain dalam bentuk apa pun.</li>
        <li><strong>Dilarang Brute Force:</strong> Dilarang melakukan serangan brute-force terhadap form submit flag atau akun tim lain (sistem dilengkapi rate-limiting otomatis).</li>
        <li><strong>Dilarang Merusak Server Soal:</strong> Dilarang menghapus flag, mengubah hak akses (privilege) target secara destruktif, atau merusak lingkungan kontainer yang dapat merugikan tim lain.</li>
      </ul>
    </Card>

    <!-- 5. Kewajiban Write-up -->
    <Card title="5. Kewajiban Write-Up">
      <ul class="rule-list">
        <li>Seluruh tim yang berhasil masuk dalam <strong>Top 10 Scoreboard</strong> di akhir kompetisi <strong>wajib</strong> mengumpulkan dokumen <em>write-up</em> resmi.</li>
        <li>Write-up berisi langkah-langkah penyelesaian dari soal-soal yang berhasil disolve, sebagai bukti keabsahan solusi.</li>
        <li>Format dan batas waktu pengumpulan write-up akan diumumkan oleh panitia melalui kanal informasi resmi.</li>
      </ul>
    </Card>
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
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin: 0;
  }

  .subtitle {
    color: var(--foreground-l2, #94a3b8);
    font-size: var(--step-0, 1rem);
    margin: 0;
  }

  .rules-grid {
    display: flex;
    flex-direction: column;
    gap: var(--space-m);
  }

  .rule-list {
    margin: 0;
    padding-left: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: var(--space-2xs);
    color: var(--foreground-l1, #cbd5e1);
    line-height: 1.6;
    font-size: 0.95rem;
  }

  .rule-list ul {
    margin-top: var(--space-3xs);
    padding-left: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: var(--space-3xs);
  }

  .badge-group {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    margin-top: 0.4rem;
  }

  .badge {
    display: inline-block;
    padding: 0.15rem 0.5rem;
    font-size: 0.75rem;
    font-weight: 600;
    border-radius: var(--radius-sm, 4px);
    background: rgba(56, 189, 248, 0.12);
    color: #38bdf8;
    border: 1px solid rgba(56, 189, 248, 0.25);
  }

  .warning-callout {
    padding: var(--space-2xs) var(--space-xs);
    background: rgba(239, 68, 68, 0.1);
    border-left: 3px solid #ef4444;
    border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
    color: #fca5a5;
    font-size: 0.875rem;
    margin-bottom: var(--space-3xs);
  }

  .alert-list li::marker {
    color: #ef4444;
  }

  code {
    padding: 0.15rem 0.4rem;
    border-radius: var(--radius-sm, 4px);
    background: rgba(0, 0, 0, 0.35);
    border: 1px solid rgba(255, 255, 255, 0.1);
    font-family: monospace;
    color: #38bdf8;
    font-size: 0.9em;
  }
</style>
