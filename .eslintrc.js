module.exports = {
	"env": {
		"browser": true,
		"es6": true,
		"commonjs": true,
		"jquery": true
	},
	"extends": [
		"eslint:recommended"
	],
	"globals": {
		"lang": "readonly",
		"log": "readonly",
		"err": "readonly",
		"dbg": "readonly",
		"wrn": "readonly",
		"assert": "readonly",
		"get_get": "readonly",
		"set_get": "readonly",
		"delay": "readonly",
		"is_dark_mode": "readonly",
		"clone_canvas": "readonly",
		"jump_to_interesting_tab": "readonly",
		"parse_float": "readonly",
		"parse_int": "readonly",
		"labels": "writable",
		"started_training": "writable",
		"taint_privacy": "writable",
		"language": "writable",
		"model": "writable"
	},
	"parserOptions": {
		"ecmaVersion": 2022,
		"sourceType": "module"
	},
	"rules": {
		"indent": "off",
		"linebreak-style": [
			"error",
			"unix"
		],
		"quotes": "off",
		"semi": [
			"error",
			"always"
		]
	}
};
