module.exports = {
    apps: [{
      name: 'node-server-app',
      script: './index.js'
    }],
    deploy: {
      production: {
        user: 'ubuntu',
        host: 'ec2-54-229-107-58.eu-west-1.compute.amazonaws.com',
        key: '~/.ssh/id_rsa',
        ref: 'origin/master',
        repo: 'git@github.com:afaelmarques7/node-basic.git',
        path: '/home/ubuntu/node-basic',
        'post-deploy': 'npm install && pm2 startOrRestart ecosystem.config.js'
      }
    }
  }