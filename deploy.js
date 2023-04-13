const request = require('request');
const fs = require('fs');
const path = require('path');
const name = process.env.NAME || 'SHELL';
const endpoint = process.env.END_POINT || 's';
const src = process.env.SRC || 's';
const auth = process.env.AUTH || 'admin@thedigitalstack.com:password';
const tenant = process.env.TENANT || 'DEU';
const tenantCookie = 'TENANT=55F1F5B9940286C063BC4A17B5738B5CEB7E55BFC6936120C51E9969B89C8D6D';



if (!src) {
	console.warn('>>>> SRC is not config yet');
	return;
}


if (!endpoint) {
	console.warn('>>>> END_POINT is not config yet');
	return;
}

console.log(` ======== CAMUNDA DEPLOYMENT ==========`)
console.log(`Using resources at [${src}]`);

const appendResource = (file, type) => {
	const result = {};
	const content = getContentDisposal(file, type);
	const fileName = file.split('/').pop();
	result[fileName] = {
		value: Buffer.from(content.data, 'utf-8'),
		options: {
			filename: content.fileName,
			contentType: content.contentType
		}
	};

	return result;
};

const getContentDisposal = (file, type) => {
	const result = {};
	result.data = fs.readFileSync(`${file}`, 'utf-8');
	const fileName = file.split('/').pop();

	switch (type) {
		case 'form' :
			result.fileName = fileName;
			result.contentType = 'application/json';
			break;
		case 'bpmn':
			result.fileName = fileName;
			result.contentType = 'application/xml';
			break;
		case 'dmn':
			result.fileName = fileName;
			result.contentType = 'application/xml';
			break;
	}

	return result;
};

const onDeploy = (error, httpResponse, body) => {
	if (httpResponse.statusCode !== 200) {
		console.log('DEPLOYMENT FAILED', httpResponse.statusCode, httpResponse.statusMessage);
	} else {
		console.log('DEPLOYMENT SUCCESS', new Date().toLocaleString() );
		console.log(`${endpoint}/deployment/${JSON.parse(body).id}/resources`);
	}
};

try {
	let payload = {
		'deployment-name': 'DEVELOPMENT-TINTHAI',
		'deployment-source': 'SHELL',
		'tenant-id': tenant
	};

	const resources = ['dmn', 'bpmn', 'form'];
	resources.forEach((resource) => {
		try {
			const files = fs.readdirSync(path.resolve(`${src}/${resource}`));
			files.length && files.filter(item => !item.startsWith('.')).forEach(( file) =>  {
				payload = { ...payload, ...appendResource(`${src}/${resource}/${file}`, resource) }
			});
		} catch(ex) {
			console.log(`[${resource.toUpperCase()}] is empty`);
		}
	})

	const headers = {
		Authorization: `Basic ${Buffer.from(auth).toString('base64')}`,
		'X-Requested-With': 'XMLHttpRequest',
		Cookie: tenantCookie
	};

	const req = request.post({
			url: `${ endpoint }/deployment/create`,
			headers,
			strictSSL: false,
			formData: payload
		},
		onDeploy
	)
} catch (ex) {
	console.log(ex.message);
}

