require("dotenv").config()
const express = require("express")
const cors = require("cors")
const mongoose = require("mongoose")


const app = express()
app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(cors())

mongoose.connect(process.env.DB_URL,{useNewUrlParser: true, useUnifiedTopology: true})


const medReminderSchema = new mongoose.Schema({
    name: String,
    mobile: String,
    medName: String,
    dosage: String,
    remindAt: String,
    isReminded: Boolean
}, {timestamps:true})

const Reminder = new mongoose.model("reminders", medReminderSchema)

setInterval(() => {
    Reminder.find().then(result => {
        result.forEach(reminder =>{
            if(!reminder.isReminded){
                const now = new Date()
                if( (new Date(reminder.remindAt) - now) < 0){
                    Reminder.findByIdAndUpdate(reminder._id, {isReminded: true})
                    .then(response => {console.log("Reminder Sent")})
                    .catch(err => {console.log(err)})
                    const accountSid = process.env.SID ;
                    const authToken = process.env.AUTH_TOKEN ;
                    const client = require('twilio')(accountSid, authToken);

                    client.messages
                        .create({
                                    from: 'whatsapp:+14155238886',
                                    body: `Hello ${reminder.name}, this a reminder for your medicine: (${reminder.medName}), dosage: (${reminder.dosage}).`,
                                    to: `whatsapp:+91${reminder.mobile}`
                        })
                        .then(message => console.log("Message Released"))
                }
            }
        })
    })
    .catch(err => {console.log(err)})
}, 1000);


    
const db = mongoose.connection;
db.on("error", (err) => {
    console.log(err);
   })
   
   db.once("open", () => {
       console.log("Database connection established");
   })


app.get("/allReminders", (req,res,next) => {
     Reminder.find().then(response => {res.send(response)})
    .catch(err => {res.json({message: "An Error Occured"})})

})

app.post("/setReminder",  async (req,res,next) =>  {

    const {name, mobile, medName, dosage, remindAt} = req.body
    let newReminder = new Reminder({
        name,
        mobile,
        medName,
        dosage,
        remindAt,
        isReminded: false
    })
    await newReminder.save()
     Reminder.find().then(response => {res.send(response)})
    .catch(err => {res.json({message: "An Error Occured"})})
    
})

app.post("/deleteReminder", async (req,res,next) => {
    
    await Reminder.deleteOne({_id: req.body.id})
    .then(() => {
        console.log("Deleted Successfully")
    })
    .catch(err => {
        console.log(err)
    })
    Reminder.find().then(response => {res.send(response)})
    .catch(err => {res.json({message: "An Error Occured"})})
     
})


 
const PORT = process.env.PORT || 3000


app.listen(PORT, () =>{
    console.log(`Server running on port ${PORT}`)
})


