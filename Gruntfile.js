module.exports = function(grunt) {

	grunt.initConfig({
		pkg : grunt.file.readJSON('package.json'),
        concat: {
            js: {
                src: 'scripts/*.js',
                dest: 'scripts/easy-math.js'
            },
            css: {
                src: 'styles/*.css',
                dest: 'styles/easy-math.css'
            }
        },
        uglify: {
            my_target: {
                files: {'scripts/easy-math.min.js': ['scripts/easy-math.js']}
            }
        },
		cssmin: {
            css:{
                src: 'styles/easy-math.css',
                dest: 'styles/easy-math.min.css'
            }
        }
	});

	grunt.loadNpmTasks('grunt-css');
	grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-concat');
	//grunt.loadNpmTasks('grunt-contrib-cssmin');
	grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.registerTask('default', ['concat', 'uglify' ,'cssmin']);
};
