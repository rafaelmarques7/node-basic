# Host Node.js server on EC2 instance

This module follows [this tutorial (part1)](https://hackernoon.com/tutorial-creating-and-managing-a-node-js-server-on-aws-part-1-d67367ac5171) and [this tutorial (part2)](https://hackernoon.com/tutorial-creating-and-managing-a-node-js-server-on-aws-part-2-5fbdea95f8a1).

## Steps taken

* Create an EC2 instance
    * configuration:
        * vpc
        * **public** subnet
        * auto-assign public ip
* configure security group
* ssh into instance
  ```bash
  sudo ssh -i /path/to/key.pem ubuntu@public_ip -v 
  ```
* install node
    ```bash
    # get NVM
    curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.32.1/install.sh | bash
    # update bash
    source ~/.bashrc
    # get node
    nvm install 7
    # confirm installation
    node -v
    ```
* create public endpoint
    * create server directory, prepare node app
        ```bash
        mkdir server && cd server
        npm init -y
        npm install express --save-dev
        ```
    * create index.js
        ```bash
        nano index.js
        ```
        ```javascript
        const express = require('express')
        const app = express()
        app.get('/', (req, res) => {
            res.send("- HEY! - Hey, don't show at me!")
        })
        app.listen(3000, () => console.log('Server running on port 3000'))
        ````
    * configure security group to allow TCP on port 3000, from cidr 0.0.0.0/0
    * run server
        ```
        node index.js
        ```
    * navigate to instance public endpoint, port 3000
        ```
        http://public_dns:PORT
        ```
* leave the server running
    * first, `ctl+z` to pause the process. this will show the proccess number, inside square brackets
    * make the process run in the background
        ```bash
        bg %PROC_NUM
        ```

## Final remarks

* this tutorial worked quite well actually.
* in the end, everything worked fine, and the server was publicly accessible. unfortunately, it is confined to port 3000. should be 80
* the node.js port should not be 80 or 443 (HTTP/HTTPS), as we may want to run multiple apps on these ports.

## Tutorial 2

* First, go to the security group and enable HTTP requests if you have not done it yet
* if something is blocking, kill the node background process
  ```bash 
  # list all processes
  ps -ef
  # kill the process
  kill PROC_NUM
  ```
  
* install nginx
  ```bash
  sudo apt-get install nginx
  ```
* start the nginx server
    ```bash
    sudo /etc/init.d/nginx start
    ```
* edit the nginx configuration to change the routing
    ```bash
    # remove current config
    sudo rm /etc/nginx/sites-enabled/default
    # setup a new one
    sudo nano /etc/nginx/sites-available/tutorial
    ```
    ```bash
    server {
        listen 80;
        server_name tutorial;
        location / {
            proxy_set_header  X-Real-IP  $remote_addr;
            proxy_set_header  Host       $http_host;
            proxy_pass        http://127.0.0.1:3000;
        }
    }
    ```
    ```bash
    # create a symbolic link
    sudo ln -s /etc/nginx/sites-available/tutorial /etc/nginx/sites-enabled/tutorial
    ```
    ```bash
    sudo service nginx restart
    ```
* (re)start the node server, and put it in the background
* visit the public url and you will ge the node server response
  
We will use `PM2` (Advances Node.js process manager) to setup the node app for when the instance crashes/restarts.

* install
  ``` 
  npm i -g pm2
  ```
* start server, allow startup when restart, and save
    ```bash
    pm2 start index.js --name "choose a name"
    pm2 startup
    pm2 save
    ```

## Deploy code to server

In order to deploy code to server, we will use github to host our source code, and we will use PM2 to clone, install and deploy the source code, from inside the ec2 instance.

* Create a github repo, post the source code there.
* Go to the ec2 instance,
    * generate a ssh key, and use it as a key in your github repo.
* Go back to the local project and
    * create an `ecosystem.config.js` file
    ```javascript
    module.exports = {
        apps: [{
            name: 'tutorial-2',
            script: './index.js'
        }],
        deploy: {
            production: {
            user: 'ubuntu',
            host: 'ec2_public_dns',
            key: '/path/to/ec2/key.pem',
            ref: 'origin/master',
            repo: 'github_ssh_clone_link',
            path: '/ec2/project/directory/path',
            'post-deploy': 'npm install && pm2 startOrRestart ecosystem.config.js'
            }
        }
    }
    ```
* update the npm script
    ```
    "scripts": {
        "restart": "pm2 startOrRestart ecosystem.config.js",
        "deploy": "pm2 deploy ecosystem.config.js production",
        "test": "echo \"Error: no test specified\" && exit 1"
    },
    ```
* go back to the instance, and run  `pm2 save`


## Notes

* This was in the nginx docs
    ```
    # You should look at the following URL's in order to grasp a solid understanding
    # of Nginx configuration files in order to fully unleash the power of Nginx.
    # https://www.nginx.com/resources/wiki/start/
    # https://www.nginx.com/resources/wiki/start/topics/tutorials/config_pitfalls/
    # https://wiki.debian.org/Nginx/DirectoryStructure
    ```
* [PM2](http://pm2.keymetrics.io/) seans to be a neat node process manager. 