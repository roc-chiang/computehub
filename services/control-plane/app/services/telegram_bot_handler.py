"""
Telegram Bot Handler
Handles incoming Telegram bot commands and webhooks
"""

import logging
from datetime import datetime
from telegram import Update
from telegram.ext import Application, CommandHandler, ContextTypes
from sqlmodel import Session, select

from app.core.db import get_session
from app.core.models import NotificationSettings
from app.services.telegram_service import get_telegram_service

logger = logging.getLogger(__name__)

# Import bind_tokens from notifications API
from app.api.v1.notifications import bind_tokens


async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """
    Handle /start command for Telegram binding
    
    Usage: /start <bind_token>
    """
    if not update.message or not update.effective_user:
        return
    
    chat_id = str(update.effective_chat.id)
    username = update.effective_user.username
    
    # Check if token is provided
    if not context.args or len(context.args) == 0:
        await update.message.reply_text(
            "👋 Welcome to ComputeHub Notification Bot!\n\n"
            "To bind your account, please use the link provided in the ComputeHub settings page."
        )
        return
    
    bind_token = context.args[0]
    
    # Validate token
    if bind_token not in bind_tokens:
        await update.message.reply_text(
            "❌ Invalid or expired binding token.\n\n"
            "Please generate a new binding link from the ComputeHub settings page."
        )
        return
    
    token_data = bind_tokens[bind_token]
    user_id = token_data["user_id"]
    expires_at = token_data["expires_at"]
    
    # Check if token expired
    if datetime.utcnow() > expires_at:
        del bind_tokens[bind_token]
        await update.message.reply_text(
            "❌ Binding token has expired.\n\n"
            "Please generate a new binding link from the ComputeHub settings page."
        )
        return
    
    # Update user's notification settings
    try:
        # Get database session
        session_gen = get_session()
        session = next(session_gen)
        
        try:
            from sqlalchemy.exc import IntegrityError
            from sqlalchemy import text
            
            # Use direct UPDATE to avoid IntegrityError
            result = session.execute(
                text("""
                    UPDATE notification_settings 
                    SET telegram_chat_id = :chat_id,
                        telegram_username = :username,
                        enable_telegram = 1,
                        updated_at = :updated_at
                    WHERE user_id = :user_id
                """),
                {
                    "chat_id": chat_id,
                    "username": username,
                    "updated_at": datetime.utcnow().isoformat(),
                    "user_id": user_id
                }
            )
            
            # If no rows updated, record doesn't exist, create it
            if result.rowcount == 0:
                session.execute(
                    text("""
                        INSERT INTO notification_settings 
                        (user_id, telegram_chat_id, telegram_username, enable_telegram, 
                         enable_email, enable_deployment_success, enable_deployment_failure,
                         enable_instance_down, enable_cost_alert, enable_price_change,
                         cost_alert_threshold, created_at, updated_at)
                        VALUES 
                        (:user_id, :chat_id, :username, 1, 1, 1, 1, 1, 1, 0, 100.0, :now, :now)
                    """),
                    {
                        "user_id": user_id,
                        "chat_id": chat_id,
                        "username": username,
                        "now": datetime.utcnow().isoformat()
                    }
                )
            
            session.commit()
            
            # Remove used token
            del bind_tokens[bind_token]
            
            await update.message.reply_text(
                "✅ Successfully bound your Telegram account!\n\n"
                f"Username: @{username}\n"
                f"Chat ID: {chat_id}\n\n"
                "You will now receive notifications from ComputeHub."
            )
            
            logger.info(f"Successfully bound Telegram for user {user_id}: @{username} ({chat_id})")
            
        finally:
            session.close()
            
    except Exception as e:
        logger.error(f"Error binding Telegram: {str(e)}")
        await update.message.reply_text(
            "❌ An error occurred while binding your account.\n\n"
            "Please try again or contact support."
        )


async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /help command"""
    if not update.message:
        return
    
    await update.message.reply_text(
        "🤖 ComputeHub Notification Bot\n\n"
        "Commands:\n"
        "/start <token> - Bind your Telegram account\n"
        "/help - Show this help message\n\n"
        "For more information, visit your ComputeHub settings page."
    )


def setup_bot_handlers(application: Application):
    """Setup bot command handlers"""
    application.add_handler(CommandHandler("start", start_command))
    application.add_handler(CommandHandler("help", help_command))
    logger.info("Telegram bot handlers registered")


async def start_telegram_bot():
    """
    Start the Telegram bot
    This should be called when the application starts
    """
    # Get database session to retrieve bot token
    session_gen = get_session()
    session = next(session_gen)
    
    try:
        telegram_service = get_telegram_service(session)
        
        if not telegram_service.is_configured():
            logger.warning("Telegram bot is not configured. Skipping bot startup.")
            return None
        
        bot_token = telegram_service.bot_token
        
        # Create application
        application = Application.builder().token(bot_token).build()
        
        # Setup handlers
        setup_bot_handlers(application)
        
        # Start polling
        logger.info("Starting Telegram bot polling...")
        await application.initialize()
        await application.start()
        await application.updater.start_polling(drop_pending_updates=True)
        
        logger.info("Telegram bot started successfully")
        return application
        
    except Exception as e:
        logger.error(f"Failed to start Telegram bot: {str(e)}")
        return None
    finally:
        session.close()


async def stop_telegram_bot(application: Application):
    """Stop the Telegram bot"""
    if application:
        logger.info("Stopping Telegram bot...")
        await application.updater.stop()
        await application.stop()
        await application.shutdown()
        logger.info("Telegram bot stopped")
