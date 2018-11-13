module.exports = {
    apps: [{
      name: 'node-basic',
      script: './index.js'
    }],
    deploy: {
      production: {
        user: 'ubuntu',
        host: 'ec2-54-229-107-58.eu-west-1.compute.amazonaws.com',
        key: '/home/rafael/.ssh/engagement-host-ec2.pem',
        ref: 'origin/master',
        repo: 'git@github.com:rafaelmarques7/node-basic.git',
        path: '/home/ubuntu/node-basic',
        'post-deploy': 'npm install && pm2 startOrRestart ecosystem.config.js'
      }
    }
  }