const express = require('express');
const cors = require('cors');
require('dotenv').config()
const jwt = require('jsonwebtoken')
const cookiePerser = require("cookie-parser"); 
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
const port = process.env.PORT || 5000; 

//middelwair
app.use(cors({
  origin: ['http://localhost:5173'],
  credentials: true
}))
app.use(express.json())
app.use(cookiePerser())





const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.2vkbeaf.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});




/// middelware

const logger = (req, res, next) => {
  console.log("loginfo", req.url);
  next()
}



const veryfayToken = (req, res, next) => {
  const token = req?.cookies.token; 
  console.log("token in the ", token);
  if(!token) {
   return res.status(401).send({message: 'unauthorize access'})
  }
  else {
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
      if(err){
       return res.status(401).send({message: "unauthorize"})
      }
      else {
        req.user = decoded 
        next()
      }
    } )
  }
  

}



async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const serviceCollection = client.db('carDoctor').collection('services')
    const checkoutCollection = client.db('carDoctor').collection('checkout')
    const newCollection = client.db('carDoctor').collection('newServices')

    //auth relate

    app.post('/jwt', async (req, res) => {
        const user = req.body; 
        console.log("user", user);
        const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1h'})
        res
          .cookie('token', token,  {
          httpOnly: true, 
          secure: false, 
        }) 
        .send(token)
    })



    app.post('/logout', async (req, res) => {
        const user = req.body; 
        console.log("loggin Out", user);
        res.clearCookie('token', {maxAge: 0}).send({success: true})
    })



    /// services related api
    app.get('/services', async (req, res) => {
        const cursor = serviceCollection.find(); 
        const result = await cursor.toArray()
        res.send(result)
    })

    app.get ('/services/:id', async (req, res) => {
        const id = req.params.id; 
        const quary = {_id: new ObjectId (id)};
        // const options = {
        //     projection: { title: 1, price: 1, img: 1, service_id: 1  },
        //   };
        const result = await serviceCollection.findOne(quary); 
        res.send(result)
    })

    /// bookinges

    app.get('/checkout', veryfayToken,  async (req, res) => {
        // console.log(req.query.email);
        // console.log(req.cookies.token);
        console.log("token woner", req.user);
        if(req.user.email !== req.query.email){
          return res.send({message: "foebidden user"})
        }
        let query = {}
        if(req.query?.email){
            query = {email: req.query.email}
        }
        const result = await checkoutCollection.find(query).toArray()
        res.send(result)
    })

    app.post('/checkout', async (req, res) => {
        const bookings = req.body; 
        console.log(bookings);
        const result = await checkoutCollection.insertOne(bookings)
        res.send(result)
    })

    app.patch('/checkout/:id', async (req, res) => {
      const updateed = req.body; 
      console.log(updateed);
      const id = req.params.id; 
      const filter = {_id: new ObjectId(id)}; 
      const updateDoc = {
        $set: {
          status: updateed.status
        },
      };
      const result = await checkoutCollection.updateOne(filter, updateDoc)
      res.send(result)

    })
   


    app.delete('/checkout/:id',async (req, res) => {
        const id = req.params.id
        const queary = {_id: new ObjectId(id)}
        const result= await checkoutCollection.deleteOne(queary)
        res.send(result)
    })


    // Product Detailes route

    app.get('/servicesDetails/:id', async (req, res) => {
        const id = req.params.id; 
        const query = {_id: new ObjectId(id)}
        const result = await serviceCollection.findOne(query)
        res.send(result)
    })


    app.post('/services', async (req, res) => {
      const addservices = req.body; 
      console.log(addservices); 
      const result = await serviceCollection.insertOne(addservices)
      res.send(result)
    })


    app.delete('/services/:id', async (req, res) => {
      const id = req.params.id;
      const quary = {_id: new ObjectId(id)} 
      const result = await serviceCollection.deleteOne(quary)
      res.send(res)
    })
    app.put('/services/:id', async (req, res) => {
      const id = req.params.id;
      const body = req.body; 
      console.log(id, body);
      const filter= {_id: new ObjectId(id)} 
      const options = { upsert: true };

      const updateDoc = {
        $set: {
          ...body
        },
      };
      const result = await serviceCollection.updateOne(filter, updateDoc, options)
      res.send(result)
    })

    app.post('/newServices', async (req, res) => {
        const newServices = req.body; 
        console.log(newServices);
        const result = await newCollection.insertOne(newServices)
        res.send(result); 
    })



    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);








app.get('/', (req, res) => {
    res.send('my server is runing')
})

app.listen(port, () => [
    console.log(`car doctor Server is runing ${port}`)
])