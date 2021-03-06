module.exports = function(grunt) {

	grunt.initConfig({
		pkg : grunt.file.readJSON('package.json'),
        concat: {
            js: {
                src: 'scripts/*.js',
                dest: 'dist/easy-math.js'
            }
//            css: {
//                src: 'styles/*.css',
//                dest: 'styles/easy-math.css'
//            }
        },
        uglify: {
            my_target: {
                files: {'dist/easy-math.min.js': ['dist/easy-math.js']}
            }
        },
		cssmin: {
            css:{
                src: 'styles/app.css',
                dest: 'styles/app.min.css'
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
