const baseUrl =
   window.location.protocol +
   '//' +
   window.location.hostname +
   (window.location.port ? ':' + window.location.port : '')

export default {
   baseUrl,
   uploadSizeLimit: 1024 * 1024 * 100,
   api: {
      file: '/file',
      dir: '/dir',
      upload: '/upload',
      delete: '/delete',
      query: '/query',
      rename: '/rename',
      mkdir: '/mkdir',
      cut: '/cut',
      copy: '/copy',
      addresses: '/addresses'
   },
   enableUpload: true
}
