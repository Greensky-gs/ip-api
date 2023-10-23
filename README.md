# Ip-API

This is an api to get ips from people who connect to it.

## Get started

1. Clone project ( `git clone https://github.com/Greensky-gs/ip-api` )
1. Install dependencies ( `yarn install` or `npm install` )
1. Fill the [.env](./.env.example) file ( see [.env](#env) )
1. Build project (`yarn build` or `npm run build`)
1. Start application ( `node dist/index.js` )

Now you can connect to `ipadress:port/login`

⚠️ There are no default users, you need to manually create a user

You can push it into the database manually, just keep in mind that the password is hashed using sha256 algorithm. The root permission is 0

You also can modify the index file, by adding this line after the imports :

```js
users.createUser({
    login: 'root',
    password: 'your password',
    perm: 0
})
```

It will create a user with root as username and all permissions

## .ENV

To fill the `.env` file, create a file named `.env` at the root of the project, and fill it with informations in [.env.example](./.env.example)

## Contact

You can contact me via [instagram](https://instagram.com/draverindustries), [discord](https://discord.gg/fHyN5w84g6) or email ( `draver.industries@proton.me` )
