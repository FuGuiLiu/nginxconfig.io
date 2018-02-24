(function() {

	var repeat = function(string, count) {
		var repeatedString = '';

		for (var i = 0; i < count; i++) {
			repeatedString += string;
		}

		return repeatedString;
	};



	angular
	.module('NginxConfigIoApp', ['ngclipboard', '720kb.tooltips'])
	.config(function NginxCongigIoConfig($locationProvider) {
		$locationProvider
			.html5Mode(true)
			.hashPrefix('!');
	})
	.controller('NginxConfigIoController', function NginxConfigIoController($scope, $location, $timeout) {
		///////////////////////
		// PRIVATE VARIABLES //
		///////////////////////
		var masonry;
		var data = {
			domain:				'',
			path:				'',
			document_root:		'/public',

			https:				false,
			http2:				true,

			cert_type:			'letsencrypt',
			email:				'',
			ssl_certificate:	'',
			ssl_certificate_key:'',

			non_www:			true,
			cdn:				false,

			index:				'',
			index_html:			false,

			php:				'7.2',
			index_php:			true,
			wordpress:			false,

			file_structure:		'unified',

			referrer_policy:			'no-referrer-when-downgrade',
			content_security_policy:	'default-src * \'unsafe-eval\' \'unsafe-inline\'',

			worker_processes:	'auto',
			user:				'www-data',
			pid:				'/run/nginx.pid',
			access_log:			'/var/log/nginx/access.log',
			error_log:			'/var/log/nginx/error.log',
			client_max_body_size: 16,
			gzip:				true,
			server_tokens:		false,
			log_not_found:		false,
			limit_req:			false,

			expires_assets:		'7d',
			expires_media:		'7d',
			expires_svg:		'7d',
			expires_fonts:		'7d',
		};



		/////////////////////
		// SCOPE VARIABLES //
		/////////////////////
		$scope.location = $location;
		$scope.data = angular.copy(data);
		$scope.dataInit = false;
		$scope.isDirty = false;

		$scope.sslCertificateChanged = false;
		$scope.sslCertificateKeyChanged = false;

		$scope.extensions = {
			assets:	'css(\\.map)?|js(\\.map)?',
			fonts:	'ttf|ttc|otf|eot|woff|woff2',
			svg:	'svgz?',
			images:	'jpe?g|png|gif|ico|cur|heic|webp|tiff?',
			audio:	'mp3|m4a|aac|ogg|midi?|wav',
			video:	'mp4|mov|webm|mpe?g|avi|ogv|flv|wmv',
			docs:	'pdf|docx?|xlsx?|pptx?'
		};

		$scope.gzipTypes = 'text/plain text/css text/xml application/json application/javascript application/xml+rss application/atom+xml image/svg+xml';

		$scope.clipboardCopy = undefined;



		/////////////////////
		// SCOPE FUNCTIONS //
		/////////////////////
		$scope.domain = function() {
			return $scope.data.domain ? $scope.data.domain : 'example.com';
		};

		$scope.sslCertificate = function() {
			if ($scope.isLetsEncrypt()) {
				return '/etc/letsencrypt/live/' + $scope.domain() + '/fullchain.pem'
			}

			if ($scope.data.ssl_certificate) {
				return $scope.data.ssl_certificate;
			}

			return '/etc/nginx/ssl/' + $scope.domain() + '.crt';
		};

		$scope.sslCertificateKey = function() {
			if ($scope.isLetsEncrypt()) {
				return '/etc/letsencrypt/live/' + $scope.domain() + '/privkey.pem'
			}

			if ($scope.data.ssl_certificate_key) {
				return $scope.data.ssl_certificate_key;
			}

			return '/etc/nginx/ssl/' + $scope.domain() + '.key';
		};

		$scope.refreshHighlighting = function() {
			var sourceCodes = document.querySelectorAll('main .file .code.source');

			for (var i = 0; i < sourceCodes.length; i++) {
				var sourceCode = sourceCodes[i];

				$timeout(function(_sourceCode) {
					_sourceCode.nextSibling.innerHTML = _sourceCode.innerHTML;
					if (_sourceCode.nextSibling.children.length && _sourceCode.nextSibling.children[0].children.length) {
						hljs.highlightBlock(_sourceCode.nextSibling.children[0].children[0]);
					}
					_sourceCode.classList.add('hidden');

					masonry.reloadItems();
					masonry.layout();
				}, 0, true, sourceCode);
			}
		};

		$scope.setDataFromHash = function() {
			var hashData = $location.search();

			for (var key in hashData) {
				if (hashData[key] === 'false') {
					hashData[key] = false;
				}

				if ($scope.data[key] !== undefined && typeof $scope.data[key] === typeof hashData[key]) {
					$scope.isDirty = true;
					$scope.data[key] = hashData[key];
					gtag('event', key, {
						event_category: 'data_from_hash',
						event_label: hashData[key],
					});
				}
			}
		};

		$scope.updateHash = function() {
			if (!$scope.dataInit) {
				return;
			}

			var changedData = {};
			for (var key in $scope.data) {
				if (!angular.equals($scope.data[key], data[key])) {
					changedData[key] = $scope.data[key];
				}
			}

			if (Object.keys(changedData).length) {
				$scope.isDirty = true;
				$location.search(changedData).replace();
			} else {
				$scope.isDirty = false;
				$location.search({});
			}
		};

		$scope.reset = function() {
			$scope.data = angular.copy(data);
			gtag('event', 'reset');
		};

		$scope.clipboardSuccess = function(key) {
			$scope.clipboardCopy = key;

			$timeout(function(_key) {
				if ($scope.clipboardCopy === _key) {
					$scope.clipboardCopy = undefined;
				}
			}, 1500, true, key);

			gtag('event', key, {
				event_category: 'clipboard',
			});
		};

		$scope.initMasonry = function() {
			masonry = new Masonry('main .files .grid', {
				itemSelector: '.grid-item',
				columnWidth: '.grid-sizer',
				percentPosition: true,
				stagger: 0,
				transitionDuration: '0.6s'
			});
		};



		///////////////////////////
		// SCOPE QUERY FUNCTIONS //
		///////////////////////////
		$scope.isUnified = function() {
			return $scope.data.file_structure === 'unified';
		};

		$scope.isModularized = function() {
			return !$scope.isUnified();
		};

		$scope.isHTTPS = function() {
			return $scope.data.https;
		};

		$scope.isHTTP2 = function() {
			return $scope.isHTTPS() && $scope.data.http2;
		};

		$scope.isLetsEncrypt = function() {
			return $scope.isHTTPS() && $scope.data.cert_type === 'letsencrypt';
		};

		$scope.isCustomCert = function() {
			return $scope.isHTTPS() && $scope.data.cert_type === 'custom';
		};

		$scope.isNonWWW = function() {
			return $scope.data.non_www;
		};

		$scope.isWWW = function() {
			return !$scope.isNonWWW();
		};

		$scope.isCDN = function() {
			return $scope.isWWW() && $scope.data.cdn;
		};

		$scope.isIndexHtml = function() {
			return $scope.data.index_html;
		};

		$scope.isPHP = function() {
			return $scope.data.php !== 'off';
		};

		$scope.isIndexPhp = function() {
			return $scope.isPHP() && $scope.data.index_php;
		};

		$scope.isWordPress = function() {
			return $scope.isPHP() && $scope.data.wordpress;
		};

		$scope.isCSP = function() {
			return !!$scope.data.content_security_policy;
		};

		$scope.isAccessLog = function() {
			return !!$scope.data.access_log;
		};

		$scope.isGzip = function() {
			return $scope.data.gzip;
		};

		$scope.isServerTokens = function() {
			return $scope.data.server_tokens;
		};

		$scope.isLogNotFound = function() {
			return $scope.data.log_not_found;
		};

		$scope.isLimitReq = function() {
			return $scope.data.limit_req;
		};





		//////////////////
		// SCOPE EVENTS //
		//////////////////
		$scope.$watch('data', function(newValue, oldValue) {
			$scope.refreshHighlighting();
			$scope.updateHash();

			for (var key in $scope.data) {
				if (!angular.equals(newValue[key], oldValue[key])) {
					gtag('event', key, {
						event_category: 'data_changed',
						event_label: $scope.data[key],
					});
				}
			}

			if (!$scope.dataInit) {
				$scope.dataInit = true;
			}
		}, true);



		//////////
		// INIT //
		//////////
		$scope.setDataFromHash();
		$scope.initMasonry();
	})
	.config(['tooltipsConfProvider', function (tooltipsConfProvider) {
		tooltipsConfProvider.configure({
			side: 'right',
			size: 'small',
		});
	}])
	.directive('ngIncludeTabs', function () {
		return {
			require: 'ngInclude',
			restrict: 'A',
			link: {
				pre: function preLink(scope, iElement, iAttrs, controller) {
					var tabs = parseInt(iAttrs.ngIncludeTabs || 0);

					var startRegex = new RegExp(repeat('\t', tabs - 1));

					controller.template = controller.template
						.replace(/^(.*)$/mg, repeat('\t', tabs) + '$1')
						.replace(startRegex, '')
						.replace(/\s*$/, '');
				},
			},
		};
	});

})();
