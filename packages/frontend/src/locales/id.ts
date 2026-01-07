// Indonesian translations for the frontend
export const id = {
  // Common
  common: {
    loading: 'Memuat...',
    save: 'Simpan',
    cancel: 'Batal',
    delete: 'Hapus',
    edit: 'Edit',
    add: 'Tambah',
    search: 'Cari',
    filter: 'Filter',
    refresh: 'Muat Ulang',
    view: 'Lihat',
    back: 'Kembali',
    submit: 'Kirim',
    retry: 'Coba Lagi',
    close: 'Tutup',
    yes: 'Ya',
    no: 'Tidak',
    all: 'Semua',
    active: 'Aktif',
    inactive: 'Tidak Aktif',
    total: 'Total',
  },

  // Navigation
  nav: {
    dashboard: 'Dasbor',
    livestock: 'Ternak',
    barns: 'Kandang',
    monitoring: 'Pemantauan',
    logs: 'Log Keluar/Masuk',
    alerts: 'Peringatan',
    scanner: 'Pemindai QR',
    settings: 'Pengaturan',
  },

  // Auth
  auth: {
    signIn: 'Masuk',
    signOut: 'Keluar',
    email: 'Email',
    password: 'Kata Sandi',
    rememberMe: 'Tetap masuk',
    enterEmailPassword: 'Masukkan email dan kata sandi Anda untuk masuk!',
    signingIn: 'Masuk...',
  },

  // Dashboard
  dashboard: {
    title: 'Dasbor',
    totalLivestock: 'Total Ternak',
    activeLivestock: 'Ternak Aktif',
    totalBarns: 'Total Kandang',
    recentEvents: 'Aktivitas Terkini',
    livestockBySpecies: 'Ternak Berdasarkan Spesies',
    livestockByStatus: 'Ternak Berdasarkan Status',
    barnOccupancy: 'Ikhtisar Okupansi Kandang',
    recentActivity: 'Aktivitas Terkini',
    distributionBySpecies: 'Distribusi berdasarkan jenis spesies',
    currentStatusDistribution: 'Distribusi status saat ini',
    capacityAndOccupancy: 'Kapasitas dan status okupansi saat ini',
    lastEntryExitEvents: '10 kejadian keluar/masuk terakhir',
    noLivestockData: 'Tidak ada data ternak',
    noBarnsAvailable: 'Tidak ada kandang tersedia',
    noRecentActivity: 'Tidak ada aktivitas terkini',
    loadingDashboard: 'Memuat dasbor...',
    failedToLoad: 'Gagal memuat dasbor',
  },

  // Livestock
  livestock: {
    title: 'Manajemen Ternak',
    addLivestock: 'Tambah Ternak',
    editLivestock: 'Edit Ternak',
    deleteLivestock: 'Hapus Ternak',
    viewDetails: 'Lihat Detail',
    earTag: 'Tag Telinga',
    name: 'Nama',
    species: 'Spesies',
    gender: 'Jenis Kelamin',
    male: 'Jantan',
    female: 'Betina',
    status: 'Status',
    sold: 'Terjual',
    deceased: 'Mati',
    weight: 'Berat',
    dateOfBirth: 'Tanggal Lahir',
    color: 'Warna',
    healthStatus: 'Status Kesehatan',
    photos: 'Foto',
    customFields: 'Field Kustom',
    searchPlaceholder: 'Cari berdasarkan nama atau tag telinga...',
    noLivestockFound: 'Tidak ada ternak ditemukan',
    confirmDelete: 'Apakah Anda yakin ingin menghapus ternak ini?',
    deleteSuccess: 'Ternak berhasil dihapus',
    deleteFailed: 'Gagal menghapus ternak',
  },

  // Barns
  barns: {
    title: 'Manajemen Kandang',
    addBarn: 'Tambah Kandang',
    editBarn: 'Edit Kandang',
    deleteBarn: 'Hapus Kandang',
    barnDetails: 'Detail Kandang',
    code: 'Kode',
    capacity: 'Kapasitas',
    occupancy: 'Okupansi',
    sensors: 'Sensor',
    assignSensor: 'Tetapkan Sensor',
    removeSensor: 'Hapus Sensor',
    searchPlaceholder: 'Cari berdasarkan nama atau kode...',
    noBarnsFound: 'Tidak ada kandang ditemukan',
    allStatus: 'Semua Status',
  },

  // Monitoring
  monitoring: {
    title: 'Pemantauan Real-time',
    subtitle: 'Pantau level gas secara real-time di semua kandang',
    connected: 'Terhubung',
    disconnected: 'Terputus',
    normal: 'Normal',
    warning: 'Peringatan',
    critical: 'Kritis',
    danger: 'Bahaya',
    unknown: 'Tidak Diketahui',
    methane: 'Metana',
    co2: 'CO2',
    ammonia: 'Amonia',
    temperature: 'Suhu',
    humidity: 'Kelembaban',
    lastReading: 'Pembacaan Terakhir',
    noData: 'Tidak ada data',
    loadingData: 'Memuat data pemantauan...',
    failedToLoad: 'Gagal memuat kandang',
  },

  // Alerts
  alerts: {
    title: 'Peringatan',
    refresh: 'Muat Ulang',
    status: 'Status',
    severity: 'Tingkat Keparahan',
    acknowledged: 'Diakui',
    resolved: 'Diselesaikan',
    info: 'Info',
    acknowledge: 'Akui',
    resolve: 'Selesaikan',
    noAlertsFound: 'Tidak ada peringatan ditemukan',
    tryAdjustingFilters: 'Coba sesuaikan filter Anda',
    allSystemsRunning: 'Semua sistem berjalan lancar',
    loadingAlerts: 'Memuat peringatan...',
  },

  // Logs
  logs: {
    title: 'Log Keluar/Masuk',
    entry: 'Masuk',
    exit: 'Keluar',
    livestockId: 'ID Ternak',
    barnId: 'ID Kandang',
    timestamp: 'Waktu',
    duration: 'Durasi',
    eventType: 'Jenis Kejadian',
    startDate: 'Tanggal Mulai',
    endDate: 'Tanggal Akhir',
    showFilters: 'Tampilkan Filter',
    hideFilters: 'Sembunyikan Filter',
    noLogsFound: 'Tidak ada log ditemukan',
    loadingLogs: 'Memuat log...',
  },

  // QR Scanner
  scanner: {
    title: 'Pindai Kode QR',
    subtitle: 'Pindai kode QR ternak untuk melihat informasi hewan',
    startScanning: 'Mulai Pindai',
    stopScanning: 'Berhenti Pindai',
    readyToScan: 'Siap memindai kode QR',
    cameraPermissionDenied: 'Izin kamera ditolak',
    failedToAccessCamera: 'Gagal mengakses kamera. Harap berikan izin kamera.',
    howToUse: 'Cara menggunakan:',
    step1: 'Klik "Mulai Pindai" untuk mengaktifkan kamera Anda',
    step2: 'Arahkan kamera Anda ke kode QR ternak',
    step3: 'Aplikasi akan secara otomatis mendeteksi dan menavigasi ke informasi hewan',
  },

  // Profile
  profile: {
    profileSettings: 'Pengaturan Profil',
    user: 'Pengguna',
    admin: 'Admin',
    farmer: 'Peternak',
  },

  // Notifications
  notifications: {
    title: 'Notifikasi',
    noNewNotifications: 'Tidak ada notifikasi baru',
  },

  // Status
  status: {
    active: 'Aktif',
    inactive: 'Tidak Aktif',
    sold: 'Terjual',
    deceased: 'Mati',
    normal: 'Normal',
    warning: 'Peringatan',
    critical: 'Kritis',
    acknowledged: 'Diakui',
    resolved: 'Diselesaikan',
  },

  // Messages
  messages: {
    confirmDelete: 'Apakah Anda yakin ingin menghapus ini?',
    deleteSuccess: 'Berhasil dihapus',
    deleteFailed: 'Gagal menghapus',
    saveSuccess: 'Berhasil disimpan',
    saveFailed: 'Gagal menyimpan',
    loadFailed: 'Gagal memuat data',
    noDataAvailable: 'Tidak ada data tersedia',
  },

  // Footer
  footer: {
    copyright: 'Sistem Pemantauan Ternak. Hak Cipta Dilindungi.',
  },
};

export default id;
