import { useState } from "react";
import styles from './SigninPage.module.css';
import { SigninController } from "../../api/signin";

const STRING_LENGTH_LIMIT = 100; // Due to django channel room group name condition

function SigninPage(){
    const [name, setName] = useState("blabla");
    const [room, setRoom] = useState(2);
    const [message, setMessage] = useState('');
    const {signin} = SigninController();

    let handleSubmit = function(e){
        e.preventDefault();
        let regex = /^[0-9A-Z]+$/i;
        if(!regex.test(name) || !regex.test(room)){
            setMessage('Name and room must be alphanumerics!');
            return;
        }
        if(name.length > STRING_LENGTH_LIMIT || room.length > STRING_LENGTH_LIMIT){
            setMessage('Name and room must be shorter than 100 letters!');
            return;
        }

        signin(name, room);
    }


    return (
        <div className={styles.signin_layout}>
            
            <div className={styles.title}>
                <h1>DOMINION</h1>
                <h1>SIGN IN</h1>
            </div>
            

            <form onSubmit={handleSubmit} className={styles.signin_form} >
                <div className={styles.container}>
                    <div className={styles.input}>
                        <label>Room</label>
                        <input id='room' type="text" name='room'
                                value={room}
                                onChange={e => setRoom(e.target.value)} />
                        <label>Name</label>
                        <input id="username" type="text" name='username'
                                value={name}
                                onChange={e => setName(e.target.value)} />
                    </div>

                    <div className = {styles.button}>
                        <button id="submit" type="submit" onClick={null} value="Enter">Enter</button>
                    </div>   

                    <button type="button" onClick={null} value="clear">CLEAR</button>
                    <div id="message" style={{color: 'red'}}>{message}</div>

                    
                </div>
            </form>
        </div>
    )
}

export default SigninPage;