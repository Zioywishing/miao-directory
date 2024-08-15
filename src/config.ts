const baseUrl = window.location.protocol + "//" + window.location.hostname + (window.location.port ? ':' + window.location.port : '');

export default {
	baseUrl,
	uploadSizeLimit: 1024 * 1024 * 100,
	api: {
		get: '/get',
		upload: '/upload',
		delete: '/delete',
		query: '/query',
		rename: '/rename',
		cut: '/cut'
	},
	enableUpload: true,
};
